import { ClassOccurrence, SubjectSummary, OverallSummary } from '../../types/attendance';
import { Subject } from '../../types/timetable';

export interface CalculationOptions {
  countExcusedAsAttended?: boolean;
}

/**
 * Calculate attendance metrics for an individual subject
 */
export function calculateSubjectSummary(
  subject: Subject,
  occurrences: ClassOccurrence[],
  targetPercentage: number = 75,
  options: CalculationOptions = { countExcusedAsAttended: false },
  allSubjects: Subject[] = []
): SubjectSummary {
  // Identify child tutorial subjects (e.g. TOC Tutorial linked to TOC Theory)
  const childSubjectIds = allSubjects
    .filter((s) => s.parentSubjectId === subject.id)
    .map((s) => s.id);

  // Match occurrences for this main subject OR its linked tutorial classes
  const subjectOccurrences = occurrences.filter(
    (occ) => occ.subjectId === subject.id || childSubjectIds.includes(occ.subjectId)
  );

  let present = 0;
  let absent = 0;
  let cancelled = 0;
  let excused = 0;
  let pending = 0;

  subjectOccurrences.forEach((occ) => {
    switch (occ.status) {
      case 'PRESENT':
        present++;
        break;
      case 'ABSENT':
        absent++;
        break;
      case 'CANCELLED':
        cancelled++;
        break;
      case 'EXCUSED':
        excused++;
        break;
      case 'PENDING':
        pending++;
        break;
    }
  });

  let baseAttended = subject.initialAttended || 0;
  let baseConducted = subject.initialConducted || 0;

  allSubjects.forEach((s) => {
    if (s.parentSubjectId === subject.id) {
      baseAttended += s.initialAttended || 0;
      baseConducted += s.initialConducted || 0;
    }
  });

  const baseAbsent = Math.max(0, baseConducted - baseAttended);

  const excusedAttendedCount = options.countExcusedAsAttended ? excused : 0;
  const attended = present + excusedAttendedCount + baseAttended;
  const actualConducted = present + absent + (options.countExcusedAsAttended ? excused : 0) + baseConducted;
  const totalAbsent = absent + baseAbsent;

  const hasData = actualConducted > 0;
  const rawPercentage = hasData ? (attended / actualConducted) * 100 : 0;
  const percentage = Math.round(rawPercentage * 10) / 10; // 1 decimal place precision

  const targetDecimal = targetPercentage / 100;

  let safeToMiss = 0;
  let classesNeeded = 0;
  let statusCategory: 'SAFE' | 'AT_RISK' | 'SHORTAGE' | 'NO_DATA' = 'NO_DATA';

  if (hasData) {
    if (percentage >= targetPercentage) {
      statusCategory = 'SAFE';
      // safeToMiss = floor(attended / target - conducted)
      const maxConductedForCurrentAttended = Math.floor(attended / targetDecimal);
      safeToMiss = Math.max(0, maxConductedForCurrentAttended - actualConducted);
    } else {
      statusCategory = percentage >= targetPercentage - 5 ? 'AT_RISK' : 'SHORTAGE';
      // classesNeeded = ceil((target * conducted - attended) / (1 - target))
      if (targetDecimal >= 1) {
        // 100% target: if missed any class, cannot recover to 100% unless conducted resets
        classesNeeded = totalAbsent > 0 ? 9999 : 0;
      } else {
        const num = targetDecimal * actualConducted - attended;
        const den = 1 - targetDecimal;
        classesNeeded = Math.max(0, Math.ceil(num / den));
      }
    }
  }

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    courseCode: subject.code,
    targetPercentage,
    conducted: actualConducted,
    attended,
    absent: totalAbsent,
    cancelled,
    excused,
    pending,
    percentage,
    hasData,
    statusCategory,
    safeToMiss,
    classesNeeded,
    initialAttended: subject.initialAttended,
    initialConducted: subject.initialConducted,
  };
}

/**
 * Filter out tutorial child subjects (merged into parent theory subject)
 * and unselected elective options (student not enrolled in course)
 */
export function getActiveMainSubjects(subjects: Subject[]): Subject[] {
  return subjects.filter((subj) => {
    if (subj.parentSubjectId) return false;
    if (subj.isElective && subj.isSelectedElective === false) return false;
    return true;
  });
}

/**
 * Calculate overall attendance summary across all active subjects in a semester
 */
export function calculateOverallSummary(
  subjects: Subject[],
  occurrences: ClassOccurrence[],
  targetPercentage: number = 75,
  options: CalculationOptions = { countExcusedAsAttended: false }
): OverallSummary {
  // Filter out tutorial child subjects (merged into parent theory subject)
  // and unselected elective options (student not enrolled)
  const activeMainSubjects = getActiveMainSubjects(subjects);

  const subjectSummaries = activeMainSubjects.map((subj) =>
    calculateSubjectSummary(subj, occurrences, targetPercentage, options, subjects)
  );

  let totalConducted = 0;
  let totalAttended = 0;
  let totalAbsent = 0;
  let totalCancelled = 0;
  let totalPending = 0;
  let totalSafeToMiss = 0;
  let totalClassesNeeded = 0;
  let subjectsBelowTarget = 0;
  let subjectsAtRisk = 0;

  subjectSummaries.forEach((sum) => {
    totalConducted += sum.conducted;
    totalAttended += sum.attended;
    totalAbsent += sum.absent;
    totalCancelled += sum.cancelled;
    totalPending += sum.pending;

    if (sum.hasData) {
      if (sum.statusCategory === 'SHORTAGE') {
        subjectsBelowTarget++;
        totalClassesNeeded += sum.classesNeeded;
      } else if (sum.statusCategory === 'AT_RISK') {
        subjectsAtRisk++;
        totalClassesNeeded += sum.classesNeeded;
      } else {
        totalSafeToMiss += sum.safeToMiss;
      }
    }
  });

  const hasData = totalConducted > 0;
  const rawPercentage = hasData ? (totalAttended / totalConducted) * 100 : 0;
  const overallPercentage = Math.round(rawPercentage * 10) / 10;

  let statusCategory: 'SAFE' | 'AT_RISK' | 'SHORTAGE' | 'NO_DATA' = 'NO_DATA';
  let statusMessage = 'NO ATTENDANCE DATA YET';

  if (hasData) {
    if (subjectsBelowTarget > 0) {
      statusCategory = 'SHORTAGE';
      statusMessage = `SHORTAGE IN ${subjectsBelowTarget} SUBJECT${subjectsBelowTarget > 1 ? 'S' : ''}! NEED ${totalClassesNeeded} CLASSES TO RECOVER PER SUBJECT.`;
    } else if (subjectsAtRisk > 0) {
      statusCategory = 'AT_RISK';
      statusMessage = `AT RISK IN ${subjectsAtRisk} SUBJECT${subjectsAtRisk > 1 ? 'S' : ''}! ATTEND NEXT CLASSES TO STAY ABOVE TARGET PER SUBJECT.`;
    } else {
      statusCategory = 'SAFE';
      statusMessage = totalSafeToMiss > 0
        ? `ALL SUBJECTS SAFE! YOU CAN SAFELY MISS UP TO ${totalSafeToMiss} CLASS${totalSafeToMiss > 1 ? 'ES' : ''}.`
        : 'ALL SUBJECTS SAFE! ATTEND NEXT CLASSES TO MAINTAIN TARGET.';
    }
  }

  return {
    totalConducted,
    totalAttended,
    totalAbsent,
    totalCancelled,
    totalPending,
    overallPercentage,
    targetPercentage,
    hasData,
    statusCategory,
    statusMessage,
    totalSafeToMiss,
    totalClassesNeeded,
    subjectsBelowTarget,
  };
}
