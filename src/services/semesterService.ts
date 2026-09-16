import { Semester, UserProfile } from '../types/semester';
import { Subject, Timetable } from '../types/timetable';
import { LocalStore } from '../lib/storage/localStorage';
import { db } from '../lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export const SemesterService = {
  async getSemesters(): Promise<Semester[]> {
    return await LocalStore.getSemesters();
  },

  async startNewSemester(
    userId: string,
    params: {
      collegeName: string;
      academicYear: string;
      branchName: string;
      semesterNumber: number;
      section: string;
      targetPercentage: number;
      startDate: string;
      endDate: string;
      copySubjects?: Subject[];
      timetable?: Timetable;
    }
  ): Promise<Semester> {
    const existingSemesters = await LocalStore.getSemesters();

    // Archive all previous current semesters
    const updatedSemesters: Semester[] = existingSemesters.map((s) => ({
      ...s,
      isCurrent: false,
      archivedAt: s.isCurrent ? new Date().toISOString() : s.archivedAt,
    }));

    const newSemId = `sem_${userId}_${params.semesterNumber}_${Date.now()}`;
    const newSemester: Semester = {
      id: newSemId,
      userId,
      collegeName: params.collegeName,
      academicYear: params.academicYear,
      branchName: params.branchName,
      semesterNumber: params.semesterNumber,
      section: params.section,
      targetPercentage: params.targetPercentage,
      startDate: params.startDate,
      endDate: params.endDate,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };

    updatedSemesters.push(newSemester);
    await LocalStore.saveSemesters(updatedSemesters);

    // Save profile update
    const profile = await LocalStore.getProfile();
    if (profile) {
      const updatedProfile: UserProfile = {
        ...profile,
        currentSemesterId: newSemId,
        academicYear: params.academicYear,
        semesterNumber: params.semesterNumber,
        section: params.section,
        attendanceTarget: params.targetPercentage,
      };
      await LocalStore.saveProfile(updatedProfile);
    }

    // Save new subjects if provided
    if (params.copySubjects) {
      await LocalStore.saveSubjects(newSemId, params.copySubjects);
    }

    // Save timetable if provided
    if (params.timetable) {
      const newTT: Timetable = {
        ...params.timetable,
        id: `tt_${newSemId}`,
        semesterId: newSemId,
      };
      await LocalStore.saveTimetable(newSemId, newTT);
    }

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'users', userId, 'semesters', newSemId), newSemester);
    } catch (err) {
      // Offline fallback
    }

    return newSemester;
  },

  async switchActiveSemester(userId: string, semesterId: string): Promise<void> {
    const profile = await LocalStore.getProfile();
    if (profile) {
      const updatedProfile = { ...profile, currentSemesterId: semesterId };
      await LocalStore.saveProfile(updatedProfile);
    }
  },
};
