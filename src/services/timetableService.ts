import { Timetable, Subject, TimetableEntry, PublishedTimetable } from '../types/timetable';
import { LocalStore } from '../lib/storage/localStorage';
import { RVCE_PUBLISHED_TIMETABLE } from '../constants/rvceData';
import { db } from '../lib/firebase/config';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export const TimetableService = {
  async getTimetable(userId: string, semesterId: string): Promise<{ timetable: Timetable | null; subjects: Subject[] }> {
    let timetable = await LocalStore.getTimetable(semesterId);
    let subjects = await LocalStore.getSubjects(semesterId);

    if (!timetable || subjects.length === 0) {
      try {
        const docSnap = await getDoc(doc(db, 'users', userId, 'semesters', semesterId, 'timetables', 'current'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          timetable = data.timetable as Timetable;
          subjects = data.subjects as Subject[];
          await LocalStore.saveTimetable(semesterId, timetable);
          await LocalStore.saveSubjects(semesterId, subjects);
        }
      } catch (err) {
        // Fallback to local store or null
      }
    }

    return { timetable, subjects };
  },

  async saveTimetable(userId: string, semesterId: string, timetable: Timetable, subjects: Subject[]): Promise<void> {
    await LocalStore.saveTimetable(semesterId, timetable);
    await LocalStore.saveSubjects(semesterId, subjects);

    try {
      await setDoc(doc(db, 'users', userId, 'semesters', semesterId, 'timetables', 'current'), {
        timetable,
        subjects,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      // Offline fallback
    }
  },

  async updateTimetableEntry(
    userId: string,
    semesterId: string,
    updatedEntry: TimetableEntry
  ): Promise<{ timetable: Timetable; subjects: Subject[] }> {
    const { timetable, subjects } = await this.getTimetable(userId, semesterId);

    if (!timetable) {
      throw new Error('Timetable not found.');
    }

    const updatedEntries = timetable.entries.map((e) =>
      e.id === updatedEntry.id ? updatedEntry : e
    );

    const updatedTT: Timetable = {
      ...timetable,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTimetable(userId, semesterId, updatedTT, subjects);
    return { timetable: updatedTT, subjects };
  },

  async deleteTimetableEntry(
    userId: string,
    semesterId: string,
    entryId: string
  ): Promise<{ timetable: Timetable; subjects: Subject[] }> {
    const { timetable, subjects } = await this.getTimetable(userId, semesterId);

    if (!timetable) {
      throw new Error('Timetable not found.');
    }

    const updatedEntries = timetable.entries.filter((e) => e.id !== entryId);

    const updatedTT: Timetable = {
      ...timetable,
      entries: updatedEntries,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTimetable(userId, semesterId, updatedTT, subjects);
    return { timetable: updatedTT, subjects };
  },

  async seedPublicTimetablesToFirestore(): Promise<void> {
    try {
      await setDoc(doc(db, 'colleges', 'rvce', 'publishedTimetables', RVCE_PUBLISHED_TIMETABLE.id), RVCE_PUBLISHED_TIMETABLE);
      await setDoc(doc(db, 'publishedTimetables', RVCE_PUBLISHED_TIMETABLE.id), RVCE_PUBLISHED_TIMETABLE);
    } catch (e) {
      // Offline fallback
    }
  },

  async getPublishedTimetables(): Promise<PublishedTimetable[]> {
    try {
      const snap = await getDocs(collection(db, 'publishedTimetables'));
      const list: PublishedTimetable[] = [];
      snap.forEach((d) => list.push(d.data() as PublishedTimetable));
      if (list.length > 0) return list;
    } catch (e) {}

    return [RVCE_PUBLISHED_TIMETABLE];
  },

  async importPublishedTimetable(
    userId: string,
    semesterId: string,
    published: PublishedTimetable
  ): Promise<{ timetable: Timetable; subjects: Subject[] }> {
    const timetable: Timetable = {
      id: `tt_${semesterId}_${Date.now()}`,
      userId,
      semesterId,
      name: `${published.collegeName} ${published.branchName} Sem ${published.semesterNumber} Sec ${published.section}`,
      collegeName: published.collegeName,
      branchName: published.branchName,
      semesterNumber: published.semesterNumber,
      section: published.section,
      academicYear: published.academicYear,
      startDate: published.effectiveFrom,
      endDate: '2026-12-31',
      entries: published.entries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveTimetable(userId, semesterId, timetable, published.subjects);
    return { timetable, subjects: published.subjects };
  },
};
