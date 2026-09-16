import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../../components/ui/KineticText';
import { KineticCard } from '../../components/ui/KineticCard';
import { KineticButton } from '../../components/ui/KineticButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OccurrenceCard } from '../../components/ui/OccurrenceCard';
import { COLORS, BORDERS } from '../../constants/theme';
import { LocalStore } from '../../lib/storage/localStorage';
import { DayOfWeek, TimetableEntry, Subject, SubjectType } from '../../types/timetable';
import { ClassOccurrence, AttendanceStatus, NotHeldReason } from '../../types/attendance';
import { MapPin, User, Clock, Plus, BookOpen, Edit2, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { RVCE_PUBLISHED_TIMETABLE } from '../../constants/rvceData';
import { TimetableService } from '../../services/timetableService';
import { OccurrenceService } from '../../services/occurrenceService';
import { calculateSubjectSummary } from '../../lib/attendance/calculator';
import { format, parseISO, addDays, subDays, isBefore } from 'date-fns';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'MON' },
  { key: 'TUESDAY', label: 'TUE' },
  { key: 'WEDNESDAY', label: 'WED' },
  { key: 'THURSDAY', label: 'THU' },
  { key: 'FRIDAY', label: 'FRI' },
  { key: 'SATURDAY', label: 'SAT' },
  { key: 'SUNDAY', label: 'SUN' },
];

export default function TimetableScreen() {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [occurrences, setOccurrences] = useState<ClassOccurrence[]>([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Slot Form State
  const [subjectName, setSubjectName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('CRB 403');
  const [faculty, setFaculty] = useState('');
  const [slotType, setSlotType] = useState<SubjectType>('THEORY');

  const loadTimetable = useCallback(async () => {
    const profile = await LocalStore.getProfile();
    const semId = profile?.currentSemesterId || 'sem_rvce_5_d';
    const subjs = await LocalStore.getSubjects(semId);
    const tt = await LocalStore.getTimetable(semId);
    
    // Ensure occurrences exist for active date range
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const occs = await OccurrenceService.ensureOccurrencesForDateRange(
      profile?.uid || 'demo_user',
      semId,
      format(subDays(selectedDate, 7), 'yyyy-MM-dd'),
      format(addDays(selectedDate, 7), 'yyyy-MM-dd')
    );

    setSubjects(subjs);
    setOccurrences(occs);
    if (tt) {
      setEntries(tt.entries || []);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  const handleDateChange = async (newDate: Date) => {
    const profile = await LocalStore.getProfile();
    const sems = await LocalStore.getSemesters();
    const sem = sems.find((s) => s.id === profile?.currentSemesterId) || sems[0];
    const semStartDate = sem?.startDate ? parseISO(sem.startDate) : parseISO('2026-09-07');

    if (isBefore(newDate, semStartDate)) {
      Alert.alert(
        'College Start Date Limit',
        `Attendance tracking starts from your college start date (${format(semStartDate, 'dd MMM yyyy')}). Cannot view or backfill prior dates.`
      );
      return;
    }

    setSelectedDate(newDate);
    const dayName = format(newDate, 'EEEE').toUpperCase() as DayOfWeek;
    if (DAYS.some((d) => d.key === dayName)) {
      setSelectedDay(dayName);
    }
  };

  const dayEntries = entries
    .filter((e) => {
      if (e.dayOfWeek !== selectedDay) return false;
      const matchingSubj = subjects.find((s) => s.id === e.subjectId || s.code === e.courseCode);
      if (matchingSubj && matchingSubj.isElective && matchingSubj.isSelectedElective === false) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateOccurrences = occurrences.filter((o) => o.date === dateStr);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setSubjectName('');
    setCourseCode('');
    setStartTime('09:00');
    setEndTime('10:00');
    setRoom('CRB 403');
    setFaculty('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setSubjectName(entry.subjectName);
    setCourseCode(entry.courseCode);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setRoom(entry.room);
    setFaculty(entry.facultyName || '');
    setSlotType(entry.type);
    setShowAddModal(true);
  };

  const handleSaveSlot = async () => {
    if (!subjectName || !courseCode || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill in required fields (Name, Code, Start Time, End Time).');
      return;
    }

    const profile = await LocalStore.getProfile();
    const uid = profile?.uid || 'demo_user';
    const semId = profile?.currentSemesterId || 'sem_rvce_5_d';

    if (editingEntry) {
      const updatedEntry: TimetableEntry = {
        ...editingEntry,
        subjectName,
        courseCode,
        dayOfWeek: selectedDay,
        startTime,
        endTime,
        room,
        type: slotType,
        facultyName: faculty || undefined,
      };

      const { timetable: updatedTT } = await TimetableService.updateTimetableEntry(uid, semId, updatedEntry);
      setEntries(updatedTT.entries);
    } else {
      const tt = await LocalStore.getTimetable(semId);
      const newEntry: TimetableEntry = {
        id: `entry_${Date.now()}`,
        timetableId: tt?.id || `tt_${semId}`,
        subjectId: `subj_${courseCode.toLowerCase()}`,
        subjectName,
        courseCode,
        dayOfWeek: selectedDay,
        startTime,
        endTime,
        room,
        type: slotType,
        facultyName: faculty || undefined,
      };

      const updatedEntries = [...entries, newEntry];
      let updatedSubjects = [...subjects];
      if (!updatedSubjects.find((s) => s.code === courseCode)) {
        updatedSubjects.push({
          id: newEntry.subjectId,
          code: courseCode,
          name: subjectName,
          type: slotType,
          room,
          facultyName: faculty || undefined,
        });
      }

      if (tt) {
        const updatedTT = { ...tt, entries: updatedEntries };
        await TimetableService.saveTimetable(uid, semId, updatedTT, updatedSubjects);
      }

      setEntries(updatedEntries);
      setSubjects(updatedSubjects);
    }

    setShowAddModal(false);
    await loadTimetable();
  };

  const handleDeleteSlot = async (entryId: string) => {
    Alert.alert('Delete Slot', 'Are you sure you want to remove this class slot from your timetable?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const profile = await LocalStore.getProfile();
          const uid = profile?.uid || 'demo_user';
          const semId = profile?.currentSemesterId || 'sem_rvce_5_d';

          const { timetable: updatedTT } = await TimetableService.deleteTimetableEntry(uid, semId, entryId);
          setEntries(updatedTT.entries);
          setShowAddModal(false);
        },
      },
    ]);
  };

  const handleUpdateOccurrenceStatus = async (
    occurrenceId: string,
    status: AttendanceStatus,
    reason?: NotHeldReason
  ) => {
    const profile = await LocalStore.getProfile();
    const uid = profile?.uid || 'demo_user';
    const semId = profile?.currentSemesterId || 'sem_rvce_5_d';

    const updated = await OccurrenceService.updateOccurrenceStatus(uid, semId, occurrenceId, status, reason);
    setOccurrences(updated);
  };

  const handleClearCustomTimetable = async () => {
    Alert.alert(
      'Start Custom Timetable',
      'This will clear all current timetable slots so you can build your own custom weekly timetable from scratch. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Build Custom',
          style: 'destructive',
          onPress: async () => {
            const profile = await LocalStore.getProfile();
            const uid = profile?.uid || 'demo_user';
            const semId = profile?.currentSemesterId || 'sem_rvce_5_d';
            const tt = await LocalStore.getTimetable(semId);
            if (tt) {
              const emptyTT = { ...tt, entries: [] };
              await TimetableService.saveTimetable(uid, semId, emptyTT, subjects);
              setEntries([]);
              Alert.alert('Custom Timetable Started', 'All slots cleared! Tap "+" to add your custom weekly class slots.');
            }
          },
        },
      ]
    );
  };

  const handleImportRVCE = async () => {
    const profile = await LocalStore.getProfile();
    const uid = profile?.uid || 'demo_user';
    const semId = profile?.currentSemesterId || 'sem_rvce_5_d';

    await TimetableService.importPublishedTimetable(uid, semId, RVCE_PUBLISHED_TIMETABLE);
    await loadTimetable();
    Alert.alert('Timetable Restored', 'Re-imported the default RVCE 5th Sem CSE Section D published timetable.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
            TIMETABLE & BACKFILL
          </KineticText>
          <KineticText variant="caption" color={COLORS.mutedForeground}>
            Edit Weekly Schedule & Mark Past Attendance
          </KineticText>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenAdd}
          style={styles.addBtn}
        >
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Date Backfill Controller */}
      <View style={styles.dateBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleDateChange(subDays(selectedDate, 1))}
          style={styles.dateNavBtn}
        >
          <ChevronLeft size={18} color={COLORS.acidYellow} />
        </TouchableOpacity>

        <View style={styles.dateCenter}>
          <CalendarIcon size={14} color={COLORS.acidYellow} />
          <KineticText variant="h3" bold color={COLORS.foreground} style={{ marginLeft: 6 }}>
            {format(selectedDate, 'EEE, dd MMM yyyy')}
          </KineticText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleDateChange(addDays(selectedDate, 1))}
          style={styles.dateNavBtn}
        >
          <ChevronRight size={18} color={COLORS.acidYellow} />
        </TouchableOpacity>
      </View>

      {/* Day Selector Bar */}
      <View style={styles.dayBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayScroll}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d.key}
              activeOpacity={0.7}
              onPress={() => setSelectedDay(d.key)}
              style={[
                styles.dayTab,
                selectedDay === d.key && styles.dayTabActive,
              ]}
            >
              <KineticText
                variant="caption"
                bold
                uppercase
                color={selectedDay === d.key ? COLORS.accentForeground : COLORS.foreground}
              >
                {d.label}
              </KineticText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Date Specific Attendance Backfill Section */}
        {selectedDateOccurrences.length > 0 && (
          <View style={styles.backfillSection}>
            <KineticText variant="caption" bold uppercase color={COLORS.acidYellow} style={{ marginBottom: 8 }}>
              ATTENDANCE RECORD FOR {format(selectedDate, 'dd MMM yyyy').toUpperCase()}
            </KineticText>

            {selectedDateOccurrences.map((occ) => {
              const subjSum = subjects.find((s) => s.id === occ.subjectId);
              const summary = subjSum ? calculateSubjectSummary(subjSum, occurrences, 75) : undefined;

              return (
                <OccurrenceCard
                  key={occ.id}
                  occurrence={occ}
                  subjectPercentage={summary?.percentage}
                  onUpdateStatus={handleUpdateOccurrenceStatus}
                />
              );
            })}
          </View>
        )}

        {/* Weekly Timetable Schedule Slots */}
        <View style={styles.subHeader}>
          <KineticText variant="h1" bold uppercase>
            {selectedDay} TIMETABLE SLOTS ({dayEntries.length})
          </KineticText>
        </View>

        {dayEntries.length > 0 ? (
          dayEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              activeOpacity={0.8}
              onPress={() => handleOpenEdit(entry)}
            >
              <KineticCard style={styles.entryCard}>
                <View style={styles.entryTop}>
                  <View style={styles.timeTag}>
                    <Clock size={12} color={COLORS.acidYellow} />
                    <KineticText variant="caption" bold color={COLORS.acidYellow} style={{ marginLeft: 4 }}>
                      {entry.startTime} - {entry.endTime}
                    </KineticText>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <StatusBadge status="SAFE" label={entry.type} size="sm" />
                    <Edit2 size={16} color={COLORS.mutedForeground} style={{ marginLeft: 8 }} />
                  </View>
                </View>

                <KineticText variant="h2" bold style={{ marginTop: 6 }}>
                  {entry.subjectName}
                </KineticText>

                <KineticText variant="caption" bold color={COLORS.mutedForeground} uppercase style={{ marginTop: 2 }}>
                  {entry.courseCode}
                </KineticText>

                <View style={styles.entryMeta}>
                  <View style={styles.metaItem}>
                    <MapPin size={13} color={COLORS.mutedForeground} />
                    <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1} style={{ marginLeft: 4, flexShrink: 1 }}>
                      {entry.room}
                    </KineticText>
                  </View>

                  {entry.facultyName ? (
                    <View style={styles.metaItem}>
                      <User size={13} color={COLORS.mutedForeground} />
                      <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1} style={{ marginLeft: 4, flexShrink: 1 }}>
                        {entry.facultyName}
                      </KineticText>
                    </View>
                  ) : null}
                </View>
              </KineticCard>
            </TouchableOpacity>
          ))
        ) : (
          <KineticCard style={styles.emptyCard}>
            <BookOpen size={32} color={COLORS.mutedForeground} />
            <KineticText variant="h3" bold color={COLORS.mutedForeground} style={{ marginTop: 8 }}>
              NO CLASSES ON {selectedDay}
            </KineticText>
            <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginTop: 4, textAlign: 'center' }}>
              Tap + to add a custom class slot or import the published RVCE timetable.
            </KineticText>

            <KineticButton
              title="IMPORT RVCE PUBLISHED TIMETABLE"
              variant="outline"
              size="sm"
              onPress={handleImportRVCE}
              style={{ marginTop: 16 }}
            />
          </KineticCard>
        )}

        {/* Custom Timetable Management Section */}
        <View style={styles.subHeader}>
          <KineticText variant="h1" bold uppercase>
            CUSTOM TIMETABLE BUILDER
          </KineticText>
        </View>

        <KineticCard style={styles.emptyCard}>
          <KineticText variant="body" color={COLORS.mutedForeground} style={{ textAlign: 'center', marginBottom: 12 }}>
            Build your own custom timetable from scratch or reset to the default RVCE published schedule.
          </KineticText>

          <View style={{ width: '100%', gap: 8 }}>
            <KineticButton
              title="+ ADD CUSTOM CLASS SLOT"
              variant="primary"
              size="sm"
              onPress={handleOpenAdd}
            />
            <KineticButton
              title="CLEAR & START BLANK TIMETABLE"
              variant="outline"
              size="sm"
              onPress={handleClearCustomTimetable}
            />
            <KineticButton
              title="RESTORE RVCE DEFAULT TIMETABLE"
              variant="outline"
              size="sm"
              onPress={handleImportRVCE}
            />
          </View>
        </KineticCard>
      </ScrollView>

      {/* Add / Edit Slot Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
              {editingEntry ? 'EDIT CLASS SLOT' : 'ADD CLASS SLOT'}
            </KineticText>

            <View style={{ marginTop: 16 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                SUBJECT NAME
              </KineticText>
              <TextInput
                style={styles.input}
                value={subjectName}
                onChangeText={setSubjectName}
                placeholder="Database Management Systems"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                COURSE CODE
              </KineticText>
              <TextInput
                style={styles.input}
                value={courseCode}
                onChangeText={setCourseCode}
                placeholder="22CS53"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6, marginTop: 12 }}>
                <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                  START TIME (HH:MM)
                </KineticText>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  placeholderTextColor={COLORS.mutedForeground}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 6, marginTop: 12 }}>
                <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                  END TIME (HH:MM)
                </KineticText>
                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:00"
                  placeholderTextColor={COLORS.mutedForeground}
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                CLASSROOM / LAB
              </KineticText>
              <TextInput
                style={styles.input}
                value={room}
                onChangeText={setRoom}
                placeholder="CSE CRB 403"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                FACULTY NAME
              </KineticText>
              <TextInput
                style={styles.input}
                value={faculty}
                onChangeText={setFaculty}
                placeholder="Prof. V. Nambiar"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <KineticButton
              title={editingEntry ? 'SAVE CHANGES' : 'ADD TO SCHEDULE'}
              variant="primary"
              size="lg"
              onPress={handleSaveSlot}
              style={{ marginTop: 20 }}
            />

            {editingEntry && (
              <KineticButton
                title="DELETE SLOT"
                variant="danger"
                size="md"
                icon={<Trash2 size={16} color="#FFF" />}
                onPress={() => handleDeleteSlot(editingEntry.id)}
                style={{ marginTop: 8 }}
              />
            )}

            <KineticButton
              title="CANCEL"
              variant="outline"
              size="md"
              onPress={() => setShowAddModal(false)}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  addBtn: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.acidYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  dateNavBtn: {
    padding: 6,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayBar: {
    backgroundColor: COLORS.background,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  dayScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginRight: 8,
    backgroundColor: COLORS.cardSurface,
  },
  dayTabActive: {
    backgroundColor: COLORS.acidYellow,
    borderColor: COLORS.acidYellow,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backfillSection: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: BORDERS.thick,
    borderBottomColor: COLORS.border,
  },
  subHeader: {
    marginBottom: 12,
  },
  entryCard: {
    marginBottom: 12,
  },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mutedSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: BORDERS.thin,
    borderTopColor: COLORS.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardSurface,
    margin: 20,
    padding: 20,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.acidYellow,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.foreground,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
  },
});
