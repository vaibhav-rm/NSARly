import { ClassOccurrence, AttendanceStatus, NotHeldReason } from '../types/attendance';
import { LocalStore } from '../lib/storage/localStorage';
import { db } from '../lib/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { generateOccurrencesForDateRange } from '../lib/attendance/occurrenceGenerator';

export const OccurrenceService = {
  async getOccurrences(semesterId: string): Promise<ClassOccurrence[]> {
    const sems = await LocalStore.getSemesters();
    const sem = sems.find((s) => s.id === semesterId);
    const occs = await LocalStore.getOccurrences(semesterId);
    if (sem && sem.startDate) {
      return occs.filter((o) => o.date >= sem.startDate);
    }
    return occs;
  },

  async ensureOccurrencesForDateRange(
    userId: string,
    semesterId: string,
    startDateStr: string,
    endDateStr: string
  ): Promise<ClassOccurrence[]> {
    const sems = await LocalStore.getSemesters();
    const sem = sems.find((s) => s.id === semesterId);
    const existing = await LocalStore.getOccurrences(semesterId);
    const timetable = await LocalStore.getTimetable(semesterId);
    const subjs = await LocalStore.getSubjects(semesterId);

    if (!timetable || !timetable.entries) return existing;

    const generated = generateOccurrencesForDateRange(
      userId,
      semesterId,
      timetable.entries,
      existing,
      startDateStr,
      endDateStr,
      sem?.startDate,
      subjs
    );

    if (generated.length > 0) {
      const merged = [...existing, ...generated];
      await LocalStore.saveOccurrences(semesterId, merged);
      return sem?.startDate ? merged.filter((o) => o.date >= sem.startDate) : merged;
    }

    return sem?.startDate ? existing.filter((o) => o.date >= sem.startDate) : existing;
  },

  async updateOccurrenceStatus(
    userId: string,
    semesterId: string,
    occurrenceId: string,
    status: AttendanceStatus,
    notHeldReason?: NotHeldReason,
    notes?: string
  ): Promise<ClassOccurrence[]> {
    const occurrences = await LocalStore.getOccurrences(semesterId);
    const updated = occurrences.map((occ) => {
      if (occ.id === occurrenceId) {
        return {
          ...occ,
          status,
          notHeldReason: status === 'CANCELLED' ? notHeldReason || 'OTHER' : undefined,
          notes: notes !== undefined ? notes : occ.notes,
          updatedAt: new Date().toISOString(),
        };
      }
      return occ;
    });

    await LocalStore.saveOccurrences(semesterId, updated);

    // Sync to Firestore
    try {
      const targetOcc = updated.find((o) => o.id === occurrenceId);
      if (targetOcc) {
        await setDoc(
          doc(db, 'users', userId, 'semesters', semesterId, 'classOccurrences', occurrenceId),
          targetOcc
        );
      }
    } catch (err) {
      // Offline fallback
    }

    return updated;
  },

  async batchUpdateOccurrences(
    userId: string,
    semesterId: string,
    occurrenceIds: string[],
    status: AttendanceStatus,
    notHeldReason?: NotHeldReason
  ): Promise<ClassOccurrence[]> {
    const occurrences = await LocalStore.getOccurrences(semesterId);
    const idSet = new Set(occurrenceIds);

    const updated = occurrences.map((occ) => {
      if (idSet.has(occ.id)) {
        return {
          ...occ,
          status,
          notHeldReason: status === 'CANCELLED' ? notHeldReason || 'OTHER' : undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return occ;
    });

    await LocalStore.saveOccurrences(semesterId, updated);
    return updated;
  },

  async saveOccurrences(semesterId: string, occurrences: ClassOccurrence[]): Promise<void> {
    await LocalStore.saveOccurrences(semesterId, occurrences);
  },
};
