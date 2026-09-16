import { describe, test, expect } from '@jest/globals';
import { calculateSubjectSummary, calculateOverallSummary } from '../calculator';
import { Subject } from '../../../types/timetable';
import { ClassOccurrence } from '../../../types/attendance';

describe('Attendance Calculation Engine', () => {
  const dummySubject: Subject = {
    id: 'subj_dbms',
    code: 'CS501',
    name: 'Database Management Systems',
    type: 'THEORY',
  };

  const createMockOccurrence = (id: string, status: ClassOccurrence['status'], subjectId: string = dummySubject.id): ClassOccurrence => ({
    id,
    userId: 'user_1',
    semesterId: 'sem_5',
    timetableEntryId: 'entry_1',
    subjectId,
    subjectName: dummySubject.name,
    courseCode: dummySubject.code,
    date: '2026-09-14',
    startTime: '10:00',
    endTime: '11:00',
    room: 'CRB 403',
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  test('calculates percentage correctly when classes are attended', () => {
    const occurrences: ClassOccurrence[] = [
      createMockOccurrence('1', 'PRESENT'),
      createMockOccurrence('2', 'PRESENT'),
      createMockOccurrence('3', 'PRESENT'),
      createMockOccurrence('4', 'ABSENT'),
    ];

    const summary = calculateSubjectSummary(dummySubject, occurrences, 75);

    expect(summary.conducted).toBe(4);
    expect(summary.attended).toBe(3);
    expect(summary.absent).toBe(1);
    expect(summary.percentage).toBe(75);
    expect(summary.statusCategory).toBe('SAFE');
    expect(summary.safeToMiss).toBe(0);
    expect(summary.classesNeeded).toBe(0);
  });

  test('cancelled / not held classes do NOT count towards conducted classes', () => {
    const occurrences: ClassOccurrence[] = [
      createMockOccurrence('1', 'PRESENT'),
      createMockOccurrence('2', 'PRESENT'),
      createMockOccurrence('3', 'PRESENT'),
      createMockOccurrence('4', 'CANCELLED'), // Lecturer skipped
      createMockOccurrence('5', 'CANCELLED'), // College event
    ];

    const summary = calculateSubjectSummary(dummySubject, occurrences, 75);

    expect(summary.conducted).toBe(3);
    expect(summary.attended).toBe(3);
    expect(summary.cancelled).toBe(2);
    expect(summary.percentage).toBe(100);
    expect(summary.safeToMiss).toBe(1); // 3 attended / 0.75 = 4 max conducted, 4 - 3 = 1 safe to miss
  });

  test('calculates safe to miss count accurately above target', () => {
    // 16 present out of 20 conducted = 80%. Target = 75%.
    // 16 / 0.75 = 21.33 -> floor = 21 max conducted.
    // 21 - 20 = 1 class safe to miss!
    const occurrences: ClassOccurrence[] = [
      ...Array(16).fill(null).map((_, i) => createMockOccurrence(`p_${i}`, 'PRESENT')),
      ...Array(4).fill(null).map((_, i) => createMockOccurrence(`a_${i}`, 'ABSENT')),
    ];

    const summary = calculateSubjectSummary(dummySubject, occurrences, 75);

    expect(summary.conducted).toBe(20);
    expect(summary.attended).toBe(16);
    expect(summary.percentage).toBe(80);
    expect(summary.statusCategory).toBe('SAFE');
    expect(summary.safeToMiss).toBe(1);
  });

  test('calculates classes needed to recover when below target', () => {
    // 12 present out of 20 conducted = 60%. Target = 75%.
    // (0.75 * 20 - 12) / (1 - 0.75) = (15 - 12) / 0.25 = 3 / 0.25 = 12 classes needed.
    const occurrences: ClassOccurrence[] = [
      ...Array(12).fill(null).map((_, i) => createMockOccurrence(`p_${i}`, 'PRESENT')),
      ...Array(8).fill(null).map((_, i) => createMockOccurrence(`a_${i}`, 'ABSENT')),
    ];

    const summary = calculateSubjectSummary(dummySubject, occurrences, 75);

    expect(summary.conducted).toBe(20);
    expect(summary.attended).toBe(12);
    expect(summary.percentage).toBe(60);
    expect(summary.statusCategory).toBe('SHORTAGE');
    expect(summary.classesNeeded).toBe(12);
  });

  test('handles zero conducted classes safely without NaN', () => {
    const summary = calculateSubjectSummary(dummySubject, [], 75);

    expect(summary.conducted).toBe(0);
    expect(summary.attended).toBe(0);
    expect(summary.percentage).toBe(0);
    expect(summary.hasData).toBe(false);
    expect(summary.statusCategory).toBe('NO_DATA');
  });

  test('calculates overall semester summary across multiple subjects', () => {
    const subj1: Subject = { id: 's1', code: 'CS501', name: 'DBMS', type: 'THEORY' };
    const subj2: Subject = { id: 's2', code: 'CS502', name: 'AIML', type: 'THEORY' };

    const occurrences: ClassOccurrence[] = [
      createMockOccurrence('1', 'PRESENT', 's1'),
      createMockOccurrence('2', 'PRESENT', 's1'),
      createMockOccurrence('3', 'PRESENT', 's2'),
      createMockOccurrence('4', 'ABSENT', 's2'),
    ];

    const overall = calculateOverallSummary([subj1, subj2], occurrences, 75);

    expect(overall.totalConducted).toBe(4);
    expect(overall.totalAttended).toBe(3);
    expect(overall.overallPercentage).toBe(75);
    expect(overall.statusCategory).toBe('SAFE');
  });

  test('merges tutorial class occurrences into parent theory course summary', () => {
    const parentTheory: Subject = { id: 'toc_theory', code: '22CS52', name: 'Theory of Computation', type: 'THEORY' };
    const childTutorial: Subject = { id: 'toc_tut', code: '22CS52T', name: 'TOC Tutorial', type: 'TUTORIAL', parentSubjectId: 'toc_theory' };

    const occurrences: ClassOccurrence[] = [
      createMockOccurrence('1', 'PRESENT', 'toc_theory'),
      createMockOccurrence('2', 'PRESENT', 'toc_theory'),
      createMockOccurrence('3', 'PRESENT', 'toc_tut'), // Tutorial class attended
      createMockOccurrence('4', 'ABSENT', 'toc_tut'),  // Tutorial class missed
    ];

    const summary = calculateSubjectSummary(parentTheory, occurrences, 75, { countExcusedAsAttended: false }, [parentTheory, childTutorial]);

    expect(summary.conducted).toBe(4);
    expect(summary.attended).toBe(3);
    expect(summary.absent).toBe(1);
    expect(summary.percentage).toBe(75);
  });

  test('excludes unselected elective courses from overall calculation', () => {
    const mainSubj: Subject = { id: 'aiml', code: '22CS51', name: 'AIML', type: 'THEORY' };
    const selectedElective: Subject = { id: 'adv_algo', code: '22CSE511', name: 'Advanced Algorithms', type: 'ELECTIVE', isElective: true, electiveGroup: 'E1', isSelectedElective: true };
    const unselectedElective: Subject = { id: 'nlp', code: '22CSE512', name: 'NLP', type: 'ELECTIVE', isElective: true, electiveGroup: 'E1', isSelectedElective: false };

    const occurrences: ClassOccurrence[] = [
      createMockOccurrence('1', 'PRESENT', 'aiml'),
      createMockOccurrence('2', 'PRESENT', 'adv_algo'),
      createMockOccurrence('3', 'ABSENT', 'nlp'), // Should be ignored because student is not enrolled
    ];

    const allSubjs = [mainSubj, selectedElective, unselectedElective];
    const overall = calculateOverallSummary(allSubjs, occurrences, 75);

    expect(overall.totalConducted).toBe(2);
    expect(overall.totalAttended).toBe(2);
    expect(overall.overallPercentage).toBe(100);
  });
});
