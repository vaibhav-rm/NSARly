import { TimetableEntry, DayOfWeek, Subject } from '../../types/timetable';
import { ClassOccurrence } from '../../types/attendance';
import { format, parseISO, addDays, isBefore, isAfter, isEqual } from 'date-fns';

const DAY_MAP: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/**
 * Generate ClassOccurrence objects for a date range based on weekly timetable entries.
 */
export function generateOccurrencesForDateRange(
  userId: string,
  semesterId: string,
  entries: TimetableEntry[],
  existingOccurrences: ClassOccurrence[],
  startDateStr: string,
  endDateStr: string,
  semesterStartDateStr?: string,
  subjects: Subject[] = []
): ClassOccurrence[] {
  const startDate = parseISO(startDateStr);
  const endDate = parseISO(endDateStr);
  const semStartDate = semesterStartDateStr ? parseISO(semesterStartDateStr) : null;

  const existingMap = new Set<string>();
  existingOccurrences.forEach((occ) => {
    // Unique key per occurrence: subjectId + date + startTime
    existingMap.add(`${occ.subjectId}_${occ.date}_${occ.startTime}`);
  });

  const generated: ClassOccurrence[] = [];
  let currDate = startDate;

  while (isBefore(currDate, endDate) || isEqual(currDate, endDate)) {
    const dayIndex = currDate.getDay();
    const dateStr = format(currDate, 'yyyy-MM-dd');

    // Skip dates strictly before the college semester start date
    if (semStartDate && isBefore(currDate, semStartDate)) {
      currDate = addDays(currDate, 1);
      continue;
    }

    // Find entries matching this day of week, excluding unselected electives
    const dayEntries = entries.filter((e) => {
      if (DAY_MAP[e.dayOfWeek] !== dayIndex) return false;
      const matchingSubj = subjects.find((s) => s.id === e.subjectId || s.code === e.courseCode);
      if (matchingSubj && matchingSubj.isElective && matchingSubj.isSelectedElective === false) {
        return false;
      }
      return true;
    });

    dayEntries.forEach((entry) => {
      const key = `${entry.subjectId}_${dateStr}_${entry.startTime}`;
      if (!existingMap.has(key)) {
        const newOcc: ClassOccurrence = {
          id: `occ_${entry.subjectId}_${dateStr}_${entry.startTime.replace(':', '')}`,
          userId,
          semesterId,
          timetableEntryId: entry.id,
          subjectId: entry.subjectId,
          subjectName: entry.subjectName,
          courseCode: entry.courseCode,
          date: dateStr,
          startTime: entry.startTime,
          endTime: entry.endTime,
          room: entry.room,
          facultyName: entry.facultyName,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        generated.push(newOcc);
        existingMap.add(key);
      }
    });

    currDate = addDays(currDate, 1);
  }

  return generated;
}
