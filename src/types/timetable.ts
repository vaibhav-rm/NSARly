export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type SubjectType = 'THEORY' | 'LAB' | 'TUTORIAL' | 'ELECTIVE';

export interface Subject {
  id: string;
  code: string;
  name: string;
  type: SubjectType;
  facultyName?: string;
  facultyEmail?: string;
  credits?: number;
  room?: string;
  color?: string;
  initialAttended?: number;
  initialConducted?: number;
  parentSubjectId?: string;
  isElective?: boolean;
  electiveGroup?: string;
  isSelectedElective?: boolean;
}

export interface TimetableEntry {
  id: string;
  timetableId: string;
  subjectId: string;
  subjectName: string;
  courseCode: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:MM (e.g. "09:00")
  endTime: string;   // HH:MM (e.g. "10:00")
  room: string;
  type: SubjectType;
  facultyName?: string;
}

export interface Timetable {
  id: string;
  userId: string;
  semesterId: string;
  name: string;
  collegeName: string;
  branchName: string;
  semesterNumber: number;
  section: string;
  academicYear: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  entries: TimetableEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PublishedTimetable {
  id: string;
  collegeId: string;
  collegeName: string;
  programId: string;
  branchName: string;
  semesterNumber: number;
  section: string;
  academicYear: string;
  effectiveFrom: string;
  subjects: Subject[];
  entries: TimetableEntry[];
}
