import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Semester } from '../../types/semester';
import { Subject, Timetable } from '../../types/timetable';
import { ClassOccurrence } from '../../types/attendance';
import { Reminder, NotificationItem } from '../../types/reminder';
import { RVCE_SUBJECTS, RVCE_TIMETABLE_ENTRIES, RVCE_COLLEGE_NAME, RVCE_BRANCH_NAME, RVCE_SEMESTER_NUMBER, RVCE_SECTION, RVCE_ACADEMIC_YEAR } from '../../constants/rvceData';
import { generateOccurrencesForDateRange } from '../attendance/occurrenceGenerator';
import { format, subDays, addDays } from 'date-fns';

const KEYS = {
  PROFILE: 'attend75_profile',
  SEMESTERS: 'attend75_semesters',
  SUBJECTS_PREFIX: 'attend75_subjects_',
  TIMETABLES_PREFIX: 'attend75_timetables_',
  OCCURRENCES_PREFIX: 'attend75_occurrences_',
  REMINDERS: 'attend75_reminders',
  NOTIFICATIONS: 'attend75_notifications',
};

// Initial Seed Data setup
export function createInitialSeedState(userId: string = 'demo_user_1') {
  const semId = 'sem_rvce_5_d';
  
  const defaultProfile: UserProfile = {
    uid: userId,
    name: 'College Student',
    email: 'student@rvce.edu.in',
    currentSemesterId: semId,
    collegeName: RVCE_COLLEGE_NAME,
    branchName: RVCE_BRANCH_NAME,
    academicYear: RVCE_ACADEMIC_YEAR,
    semesterNumber: RVCE_SEMESTER_NUMBER,
    section: RVCE_SECTION,
    attendanceTarget: 75,
    notificationsEnabled: true,
  };

  const defaultSemester: Semester = {
    id: semId,
    userId,
    collegeName: RVCE_COLLEGE_NAME,
    academicYear: RVCE_ACADEMIC_YEAR,
    branchName: RVCE_BRANCH_NAME,
    semesterNumber: RVCE_SEMESTER_NUMBER,
    section: RVCE_SECTION,
    targetPercentage: 75,
    startDate: '2026-09-07',
    endDate: '2026-12-31',
    isCurrent: true,
    createdAt: new Date().toISOString(),
  };

  const defaultTimetable: Timetable = {
    id: 'tt_rvce_5_d',
    userId,
    semesterId: semId,
    name: 'RVCE CSE 5th Sem Sec D Timetable',
    collegeName: RVCE_COLLEGE_NAME,
    branchName: RVCE_BRANCH_NAME,
    semesterNumber: RVCE_SEMESTER_NUMBER,
    section: RVCE_SECTION,
    academicYear: RVCE_ACADEMIC_YEAR,
    startDate: '2026-09-07',
    endDate: '2026-12-31',
    entries: RVCE_TIMETABLE_ENTRIES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Generate initial occurrences starting from college start date (2026-09-07)
  const today = new Date();
  const startRange = defaultSemester.startDate; // '2026-09-07'
  const endRange = format(addDays(today, 14), 'yyyy-MM-dd');

  const initialOccurrences = generateOccurrencesForDateRange(
    userId,
    semId,
    RVCE_TIMETABLE_ENTRIES,
    [],
    startRange,
    endRange
  );

  // Mark some sample occurrences for testing attendance calculation
  const todayStr = format(today, 'yyyy-MM-dd');
  const occurrences = initialOccurrences.map((occ) => {
    if (occ.date < todayStr) {
      // Past classes: mark mostly present
      if (occ.subjectId === 'rvce_dbms' && occ.id.endsWith('1')) {
        return { ...occ, status: 'ABSENT' as const };
      }
      return { ...occ, status: 'PRESENT' as const };
    }
    return occ;
  });

  const defaultReminders: Reminder[] = [
    {
      id: 'rem_1',
      userId,
      title: 'DBMS Assignment 2 Submission',
      description: 'Submit ER diagram and normalisation report',
      dateTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      type: 'ASSIGNMENT',
      relatedSubjectId: 'rvce_dbms',
      notificationEnabled: true,
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem_2',
      userId,
      title: 'AIML Lab Test',
      description: 'Prepare K-Means and Decision Trees code',
      dateTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      type: 'EXAM',
      relatedSubjectId: 'rvce_aiml_lab',
      notificationEnabled: true,
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const defaultNotifications: NotificationItem[] = [
    {
      id: 'notif_1',
      userId,
      title: 'Welcome to NSARly',
      body: 'Your RVCE CSE 5th Sem Sec D timetable is active. Target is set to 75%.',
      type: 'INFO',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_2',
      userId,
      title: 'Attendance Reminder',
      body: 'Don\'t forget to mark your classes for today!',
      type: 'REMINDER',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    profile: defaultProfile,
    semesters: [defaultSemester],
    subjects: RVCE_SUBJECTS,
    timetable: defaultTimetable,
    occurrences,
    reminders: defaultReminders,
    notifications: defaultNotifications,
  };
}

export const LocalStore = {
  async getProfile(): Promise<UserProfile | null> {
    const json = await AsyncStorage.getItem(KEYS.PROFILE);
    return json ? JSON.parse(json) : null;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  async getSemesters(): Promise<Semester[]> {
    const json = await AsyncStorage.getItem(KEYS.SEMESTERS);
    return json ? JSON.parse(json) : [];
  },

  async saveSemesters(semesters: Semester[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SEMESTERS, JSON.stringify(semesters));
  },

  async getSubjects(semesterId: string): Promise<Subject[]> {
    const json = await AsyncStorage.getItem(KEYS.SUBJECTS_PREFIX + semesterId);
    return json ? JSON.parse(json) : [];
  },

  async saveSubjects(semesterId: string, subjects: Subject[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SUBJECTS_PREFIX + semesterId, JSON.stringify(subjects));
  },

  async getTimetable(semesterId: string): Promise<Timetable | null> {
    const json = await AsyncStorage.getItem(KEYS.TIMETABLES_PREFIX + semesterId);
    return json ? JSON.parse(json) : null;
  },

  async saveTimetable(semesterId: string, timetable: Timetable): Promise<void> {
    await AsyncStorage.setItem(KEYS.TIMETABLES_PREFIX + semesterId, JSON.stringify(timetable));
  },

  async getOccurrences(semesterId: string): Promise<ClassOccurrence[]> {
    const json = await AsyncStorage.getItem(KEYS.OCCURRENCES_PREFIX + semesterId);
    return json ? JSON.parse(json) : [];
  },

  async saveOccurrences(semesterId: string, occurrences: ClassOccurrence[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.OCCURRENCES_PREFIX + semesterId, JSON.stringify(occurrences));
  },

  async getReminders(): Promise<Reminder[]> {
    const json = await AsyncStorage.getItem(KEYS.REMINDERS);
    return json ? JSON.parse(json) : [];
  },

  async saveReminders(reminders: Reminder[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const json = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
    return json ? JSON.parse(json) : [];
  },

  async saveNotifications(notifications: NotificationItem[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  },
};
