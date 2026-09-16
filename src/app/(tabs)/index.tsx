import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SemesterHeader } from '../../components/ui/SemesterHeader';
import { AttendanceDial } from '../../components/ui/AttendanceDial';
import { OccurrenceCard } from '../../components/ui/OccurrenceCard';
import { KineticCard } from '../../components/ui/KineticCard';
import { KineticText } from '../../components/ui/KineticText';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, BORDERS } from '../../constants/theme';
import { LocalStore, createInitialSeedState } from '../../lib/storage/localStorage';
import { calculateOverallSummary, calculateSubjectSummary, getActiveMainSubjects } from '../../lib/attendance/calculator';
import { OccurrenceService } from '../../services/occurrenceService';
import { SemesterService } from '../../services/semesterService';
import { UserProfile, Semester } from '../../types/semester';
import { Subject, Timetable } from '../../types/timetable';
import { ClassOccurrence, AttendanceStatus, NotHeldReason, OverallSummary, SubjectSummary } from '../../types/attendance';
import { NotificationItem } from '../../types/reminder';
import { format } from 'date-fns';
import { CheckCheck, CalendarCheck } from 'lucide-react-native';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [occurrences, setOccurrences] = useState<ClassOccurrence[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  // Computed Summaries
  const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);

  const loadData = useCallback(async () => {
    let prof = await LocalStore.getProfile();
    let sems = await LocalStore.getSemesters();

    if (!prof || sems.length === 0) {
      const seed = createInitialSeedState();
      await LocalStore.saveProfile(seed.profile);
      await LocalStore.saveSemesters(seed.semesters);
      await LocalStore.saveSubjects(seed.semesters[0].id, seed.subjects);
      await LocalStore.saveTimetable(seed.semesters[0].id, seed.timetable);
      await LocalStore.saveOccurrences(seed.semesters[0].id, seed.occurrences);
      await LocalStore.saveReminders(seed.reminders);
      await LocalStore.saveNotifications(seed.notifications);

      prof = seed.profile;
      sems = seed.semesters;
    }

    setProfile(prof);
    setSemesters(sems);

    const activeSem = sems.find((s) => s.id === prof?.currentSemesterId) || sems[0];
    setActiveSemester(activeSem);

    if (activeSem) {
      const subjs = await LocalStore.getSubjects(activeSem.id);
      const tt = await LocalStore.getTimetable(activeSem.id);
      const occs = await LocalStore.getOccurrences(activeSem.id);
      const notifs = await LocalStore.getNotifications();

      setSubjects(subjs);
      setTimetable(tt);
      setOccurrences(occs);
      setNotifications(notifs);

      // Calculate Metrics
      const target = activeSem.targetPercentage || 75;
      const overall = calculateOverallSummary(subjs, occs, target);
      const activeSubjs = getActiveMainSubjects(subjs);
      const subSummaries = activeSubjs.map((s) => calculateSubjectSummary(s, occs, target, { countExcusedAsAttended: false }, subjs));

      setOverallSummary(overall);
      setSubjectSummaries(subSummaries);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Status marking handler
  const handleUpdateStatus = async (
    occurrenceId: string,
    status: AttendanceStatus,
    reason?: NotHeldReason
  ) => {
    if (!activeSemester || !profile) return;

    const updatedOccs = await OccurrenceService.updateOccurrenceStatus(
      profile.uid,
      activeSemester.id,
      occurrenceId,
      status,
      reason
    );

    setOccurrences(updatedOccs);

    // Recalculate metrics
    const target = activeSemester.targetPercentage || 75;
    const overall = calculateOverallSummary(subjects, updatedOccs, target);
    const activeSubjs = getActiveMainSubjects(subjects);
    const subSummaries = activeSubjs.map((s) => calculateSubjectSummary(s, updatedOccs, target, { countExcusedAsAttended: false }, subjects));

    setOverallSummary(overall);
    setSubjectSummaries(subSummaries);
  };

  // Batch marking actions
  const handleBatchMark = async (status: AttendanceStatus) => {
    if (!activeSemester || !profile) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayOccs = occurrences.filter((o) => o.date === todayStr);

    if (todayOccs.length === 0) {
      Alert.alert('No Classes Today', 'There are no scheduled class occurrences for today.');
      return;
    }

    Alert.alert(
      'Confirm Bulk Action',
      `Are you sure you want to mark all ${todayOccs.length} classes for today as ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: status === 'ABSENT' ? 'destructive' : 'default',
          onPress: async () => {
            const ids = todayOccs.map((o) => o.id);
            const updated = await OccurrenceService.batchUpdateOccurrences(
              profile.uid,
              activeSemester.id,
              ids,
              status
            );
            setOccurrences(updated);

            const target = activeSemester.targetPercentage || 75;
            const activeSubjs = getActiveMainSubjects(subjects);
            setOverallSummary(calculateOverallSummary(subjects, updated, target));
            setSubjectSummaries(activeSubjs.map((s) => calculateSubjectSummary(s, updated, target, { countExcusedAsAttended: false }, subjects)));
          },
        },
      ]
    );
  };

  // Switch Active Semester
  const handleSwitchSemester = async (sem: Semester) => {
    if (!profile) return;
    await SemesterService.switchActiveSemester(profile.uid, sem.id);
    setShowSemesterModal(false);
    await loadData();
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayOccurrences = occurrences.filter((o) => o.date === todayStr);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <SemesterHeader
        collegeName={activeSemester?.collegeName}
        branchName={activeSemester?.branchName}
        semesterNumber={activeSemester?.semesterNumber}
        section={activeSemester?.section}
        unreadNotificationsCount={unreadCount}
        onOpenSemesterModal={() => setShowSemesterModal(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.acidYellow} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Hero Display */}
        {overallSummary && (
          <AttendanceDial
            percentage={overallSummary.overallPercentage}
            targetPercentage={overallSummary.targetPercentage}
            statusCategory={overallSummary.statusCategory}
            statusMessage={overallSummary.statusMessage}
            hasData={overallSummary.hasData}
          />
        )}

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCardWrapper}>
            <KineticCard style={styles.kpiCard}>
              <KineticText variant="caption" bold uppercase color={COLORS.mutedForeground}>
                CONDUCTED
              </KineticText>
              <KineticText variant="h1" bold style={{ marginTop: 4 }}>
                {overallSummary?.totalConducted || 0}
              </KineticText>
            </KineticCard>
          </View>

          <View style={styles.kpiCardWrapper}>
            <KineticCard style={styles.kpiCard}>
              <KineticText variant="caption" bold uppercase color={COLORS.status.safe}>
                ATTENDED
              </KineticText>
              <KineticText variant="h1" bold color={COLORS.status.safe} style={{ marginTop: 4 }}>
                {overallSummary?.totalAttended || 0}
              </KineticText>
            </KineticCard>
          </View>

          <View style={styles.kpiCardWrapper}>
            <KineticCard style={styles.kpiCard}>
              <KineticText variant="caption" bold uppercase color={COLORS.status.shortage}>
                ABSENT
              </KineticText>
              <KineticText variant="h1" bold color={COLORS.status.shortage} style={{ marginTop: 4 }}>
                {overallSummary?.totalAbsent || 0}
              </KineticText>
            </KineticCard>
          </View>

          <View style={styles.kpiCardWrapper}>
            <KineticCard style={styles.kpiCard}>
              <KineticText variant="caption" bold uppercase color={COLORS.acidYellow}>
                SAFE TO MISS
              </KineticText>
              <KineticText variant="h1" bold color={COLORS.acidYellow} style={{ marginTop: 4 }}>
                {overallSummary?.totalSafeToMiss || 0}
              </KineticText>
            </KineticCard>
          </View>
        </View>

        {/* Today's Attendance Workflow Section */}
        <View style={styles.sectionHeader}>
          <KineticText variant="h1" bold uppercase>
            TODAY'S CLASSES ({todayOccurrences.length})
          </KineticText>
          <KineticText variant="caption" color={COLORS.mutedForeground}>
            {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </KineticText>
        </View>

        {/* Batch Actions */}
        {todayOccurrences.length > 0 && (
          <View style={styles.batchRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleBatchMark('PRESENT')}
              style={[styles.batchBtn, { backgroundColor: COLORS.status.safe }]}
            >
              <CheckCheck size={14} color="#000" />
              <KineticText variant="caption" bold color="#000" style={{ marginLeft: 4 }}>
                ALL PRESENT
              </KineticText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleBatchMark('CANCELLED')}
              style={[styles.batchBtn, { backgroundColor: COLORS.mutedSurface }]}
            >
              <CalendarCheck size={14} color={COLORS.foreground} />
              <KineticText variant="caption" bold color={COLORS.foreground} style={{ marginLeft: 4 }}>
                ALL NOT HELD
              </KineticText>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's Occurrence Cards */}
        {todayOccurrences.length > 0 ? (
          todayOccurrences.map((occ) => {
            const subjSummary = subjectSummaries.find((s) => s.subjectId === occ.subjectId);
            return (
              <OccurrenceCard
                key={occ.id}
                occurrence={occ}
                subjectPercentage={subjSummary?.percentage}
                onUpdateStatus={handleUpdateStatus}
              />
            );
          })
        ) : (
          <KineticCard style={styles.emptyCard}>
            <KineticText variant="h3" bold color={COLORS.mutedForeground} style={{ textAlign: 'center' }}>
              NO CLASSES SCHEDULED FOR TODAY
            </KineticText>
            <KineticText variant="caption" color={COLORS.mutedForeground} style={{ textAlign: 'center', marginTop: 4 }}>
              Check your timetable tab for upcoming weekly classes.
            </KineticText>
          </KineticCard>
        )}

        {/* Subject-Wise Quick Breakdown */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <KineticText variant="h1" bold uppercase>
            SUBJECT ATTENDANCE
          </KineticText>
        </View>

        {subjectSummaries.map((sum) => (
          <KineticCard key={sum.subjectId} style={styles.subjectRowCard}>
            <View style={styles.subjectTop}>
              <View style={{ flex: 1 }}>
                <KineticText variant="caption" bold color={COLORS.acidYellow} uppercase>
                  {sum.courseCode}
                </KineticText>
                <KineticText variant="h2" bold style={{ marginTop: 2 }}>
                  {sum.subjectName}
                </KineticText>
              </View>

              <View style={styles.subjectPctBox}>
                <KineticText
                  variant="h1"
                  bold
                  color={
                    sum.statusCategory === 'SAFE'
                      ? COLORS.status.safe
                      : sum.statusCategory === 'SHORTAGE'
                      ? COLORS.status.shortage
                      : COLORS.foreground
                  }
                >
                  {sum.hasData ? `${sum.percentage}%` : 'N/A'}
                </KineticText>
              </View>
            </View>

            <View style={styles.subjectBottom}>
              <StatusBadge status={sum.statusCategory} size="sm" />

              <KineticText
                variant="caption"
                color={COLORS.mutedForeground}
                numberOfLines={1}
                style={{ flex: 1, textAlign: 'right', flexShrink: 1, marginLeft: 8 }}
              >
                {sum.attended}/{sum.conducted} Attended
                {sum.safeToMiss > 0 ? ` • Safe to miss ${sum.safeToMiss}` : ''}
                {sum.classesNeeded > 0 ? ` • Need ${sum.classesNeeded} classes` : ''}
              </KineticText>
            </View>
          </KineticCard>
        ))}
      </ScrollView>

      {/* Semester Switcher Modal */}
      <Modal visible={showSemesterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
              SELECT ACADEMIC SEMESTER
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4, marginBottom: 16 }}>
              Switch workspace context to view historical semester attendance.
            </KineticText>

            {semesters.map((sem) => (
              <TouchableOpacity
                key={sem.id}
                activeOpacity={0.7}
                onPress={() => handleSwitchSemester(sem)}
                style={[
                  styles.semOption,
                  sem.id === activeSemester?.id && styles.semOptionActive,
                ]}
              >
                <View style={{ flex: 1, marginRight: 8 }}>
                  <KineticText variant="h3" bold color={COLORS.foreground} numberOfLines={1}>
                    {sem.collegeName} • SEM {sem.semesterNumber} ({sem.section})
                  </KineticText>
                  <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1}>
                    {sem.academicYear} • {sem.branchName}
                  </KineticText>
                </View>
                {sem.id === activeSemester?.id && <StatusBadge status="SAFE" label="ACTIVE" size="sm" />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSemesterModal(false)}
              style={styles.closeBtn}
            >
              <KineticText variant="caption" bold color={COLORS.foreground} uppercase>
                CLOSE
              </KineticText>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 20,
  },
  kpiCardWrapper: {
    width: '50%',
    padding: 4,
  },
  kpiCard: {
    padding: 12,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  batchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  batchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  subjectRowCard: {
    marginBottom: 10,
    padding: 14,
  },
  subjectTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectPctBox: {
    alignItems: 'flex-end',
  },
  subjectBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: BORDERS.thin,
    borderTopColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardSurface,
    borderTopWidth: BORDERS.thick,
    borderTopColor: COLORS.acidYellow,
    padding: 20,
    maxHeight: '80%',
  },
  semOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.mutedSurface,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  semOptionActive: {
    borderColor: COLORS.acidYellow,
    borderWidth: BORDERS.thick,
  },
  closeBtn: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
  },
});
