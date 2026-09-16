export interface Semester {
  id: string;
  userId: string;
  collegeName: string;
  academicYear: string; // e.g. "2026-27"
  branchName: string;   // e.g. "Computer Science & Engineering"
  semesterNumber: number; // e.g. 5
  section: string;      // e.g. "D"
  targetPercentage: number; // default 75
  startDate: string;    // YYYY-MM-DD
  endDate: string;      // YYYY-MM-DD
  isCurrent: boolean;
  createdAt: string;
  archivedAt?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  currentSemesterId?: string;
  collegeName?: string;
  branchName?: string;
  academicYear?: string;
  semesterNumber?: number;
  section?: string;
  attendanceTarget?: number;
  notificationsEnabled?: boolean;
}
