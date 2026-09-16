export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CANCELLED' | 'EXCUSED' | 'PENDING';

export type NotHeldReason =
  | 'LECTURER_ABSENT'
  | 'COLLEGE_EVENT'
  | 'HOLIDAY'
  | 'ROOM_UNAVAILABLE'
  | 'CLASS_SHIFTED'
  | 'OTHER';

export interface ClassOccurrence {
  id: string;
  userId: string;
  semesterId: string;
  timetableEntryId: string;
  subjectId: string;
  subjectName: string;
  courseCode: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  room: string;
  facultyName?: string;
  status: AttendanceStatus;
  notHeldReason?: NotHeldReason;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  semesterId: string;
  occurrenceId: string;
  subjectId: string;
  status: AttendanceStatus;
  timestamp: string;
  notes?: string;
}

export interface SubjectSummary {
  subjectId: string;
  subjectName: string;
  courseCode: string;
  targetPercentage: number;
  conducted: number;
  attended: number;
  absent: number;
  cancelled: number;
  excused: number;
  pending: number;
  percentage: number; // 0-100
  hasData: boolean;
  statusCategory: 'SAFE' | 'AT_RISK' | 'SHORTAGE' | 'NO_DATA';
  safeToMiss: number;
  classesNeeded: number;
  initialAttended?: number;
  initialConducted?: number;
}

export interface OverallSummary {
  totalConducted: number;
  totalAttended: number;
  totalAbsent: number;
  totalCancelled: number;
  totalPending: number;
  overallPercentage: number;
  targetPercentage: number;
  hasData: boolean;
  statusCategory: 'SAFE' | 'AT_RISK' | 'SHORTAGE' | 'NO_DATA';
  statusMessage: string;
  totalSafeToMiss: number;
  totalClassesNeeded: number;
  subjectsBelowTarget: number;
}
