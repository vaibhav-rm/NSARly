import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { KineticText } from '../../components/ui/KineticText';
import { KineticCard } from '../../components/ui/KineticCard';
import { KineticButton } from '../../components/ui/KineticButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, BORDERS } from '../../constants/theme';
import { LocalStore } from '../../lib/storage/localStorage';
import { calculateSubjectSummary, calculateOverallSummary, getActiveMainSubjects } from '../../lib/attendance/calculator';
import { SubjectSummary, ClassOccurrence, OverallSummary } from '../../types/attendance';
import { Subject } from '../../types/timetable';
import { UserProfile } from '../../types/semester';
import { ShieldCheck, AlertOctagon, Info, Edit3, CheckCircle, Sliders, Layers } from 'lucide-react-native';

export default function AttendanceScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [occurrences, setOccurrences] = useState<ClassOccurrence[]>([]);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);
  const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Untracked Backfill Modal State
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [initAttended, setInitAttended] = useState('0');
  const [initConducted, setInitConducted] = useState('0');

  const loadData = useCallback(async () => {
    const prof = await LocalStore.getProfile();
    const semId = prof?.currentSemesterId || 'sem_rvce_5_d';
    const subjs = await LocalStore.getSubjects(semId);
    const occs = await LocalStore.getOccurrences(semId);

    setProfile(prof);
    setSubjects(subjs);
    setOccurrences(occs);

    const target = 75;
    const activeSubjs = getActiveMainSubjects(subjs);
    setOverallSummary(calculateOverallSummary(subjs, occs, target));
    setSubjectSummaries(
      activeSubjs.map((s) => calculateSubjectSummary(s, occs, target, { countExcusedAsAttended: false }, subjs))
    );
  }, []);

  // Reload data automatically whenever tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Elective Selection Toggle Handler
  const handleToggleElectiveSelection = async (subjectId: string) => {
    const semId = profile?.currentSemesterId || 'sem_rvce_5_d';
    const targetSubj = subjects.find((s) => s.id === subjectId);
    if (!targetSubj) return;

    const updatedSubjects = subjects.map((s) => {
      if (s.id === subjectId) {
        return { ...s, isSelectedElective: true };
      }
      if (s.electiveGroup && s.electiveGroup === targetSubj.electiveGroup) {
        return { ...s, isSelectedElective: false };
      }
      return s;
    });

    await LocalStore.saveSubjects(semId, updatedSubjects);
    setSubjects(updatedSubjects);

    // Recalculate metrics immediately
    const target = 75;
    const activeSubjs = getActiveMainSubjects(updatedSubjects);
    setOverallSummary(calculateOverallSummary(updatedSubjects, occurrences, target));
    setSubjectSummaries(
      activeSubjs.map((s) => calculateSubjectSummary(s, occurrences, target, { countExcusedAsAttended: false }, updatedSubjects))
    );

    Alert.alert('Elective Enrolled', `Enrolled in ${targetSubj.name} (${targetSubj.code}). Alternate electives removed from active target calculations.`);
  };

  // Open Untracked Backfill Modal
  const handleOpenEditSubject = (subjId: string) => {
    const subj = subjects.find((s) => s.id === subjId);
    if (!subj) return;
    setEditingSubject(subj);
    setInitAttended(String(subj.initialAttended || 0));
    setInitConducted(String(subj.initialConducted || 0));
  };

  // Save Untracked Backfill Counts
  const handleSaveInitialAttendance = async () => {
    if (!editingSubject) return;
    const semId = profile?.currentSemesterId || 'sem_rvce_5_d';

    const attended = parseInt(initAttended, 10) || 0;
    const conducted = parseInt(initConducted, 10) || 0;

    if (attended > conducted) {
      Alert.alert('Validation Error', 'Attended classes cannot exceed total conducted classes.');
      return;
    }

    const updatedSubjects = subjects.map((s) =>
      s.id === editingSubject.id ? { ...s, initialAttended: attended, initialConducted: conducted } : s
    );

    await LocalStore.saveSubjects(semId, updatedSubjects);
    setSubjects(updatedSubjects);
    setEditingSubject(null);

    // Recalculate metrics
    const target = 75;
    const activeSubjs = getActiveMainSubjects(updatedSubjects);
    setOverallSummary(calculateOverallSummary(updatedSubjects, occurrences, target));
    setSubjectSummaries(
      activeSubjs.map((s) => calculateSubjectSummary(s, occurrences, target, { countExcusedAsAttended: false }, updatedSubjects))
    );

    Alert.alert('Backfill Saved', `Updated previous untracked attendance for ${editingSubject.code}: ${attended}/${conducted} classes.`);
  };

  const selectedSubjectOccurrences = selectedSubjectId
    ? occurrences.filter((o) => o.subjectId === selectedSubjectId)
    : occurrences;

  const electiveSubjects = subjects.filter((s) => s.isElective);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
          ATTENDANCE HUB
        </KineticText>
        <KineticText variant="caption" color={COLORS.mutedForeground}>
          75% Target Predictor, Elective Selector & Backfill Manager
        </KineticText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.acidYellow} />}
      >
        {/* Overall Prediction Banner */}
        {overallSummary && (
          <KineticCard
            accent
            style={[
              styles.predictionBanner,
              overallSummary.statusCategory === 'SHORTAGE' && styles.shortageBanner,
            ]}
          >
            <View style={styles.bannerTop}>
              {overallSummary.statusCategory === 'SHORTAGE' ? (
                <AlertOctagon size={24} color={COLORS.status.shortage} />
              ) : (
                <ShieldCheck size={24} color={COLORS.acidYellow} />
              )}
              <KineticText variant="h2" bold uppercase style={{ marginLeft: 8 }}>
                75% PREDICTOR STATUS
              </KineticText>
            </View>

            <KineticText variant="hero" bold color={COLORS.acidYellow} style={{ marginVertical: 4 }}>
              {overallSummary.overallPercentage}%
            </KineticText>

            <KineticText variant="body" bold uppercase color={COLORS.foreground}>
              {overallSummary.statusMessage}
            </KineticText>
          </KineticCard>
        )}

        {/* Elective Selection Section */}
        {electiveSubjects.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View style={styles.sectionHeader}>
              <KineticText variant="h1" bold uppercase>
                ELECTIVE COURSE SELECTION ({electiveSubjects.length})
              </KineticText>
            </View>

            <KineticCard style={styles.card}>
              <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginBottom: 12 }}>
                Tap to select your enrolled elective course for this semester. Unselected elective options are automatically excluded from your timetable and percentage targets.
              </KineticText>

              {electiveSubjects.map((subj) => (
                <TouchableOpacity
                  key={subj.id}
                  activeOpacity={0.8}
                  onPress={() => handleToggleElectiveSelection(subj.id)}
                  style={[
                    styles.electiveItem,
                    subj.isSelectedElective && styles.electiveItemActive,
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <KineticText variant="caption" bold color={COLORS.acidYellow} uppercase>
                      {subj.code} • {subj.electiveGroup || 'ELECTIVE'}
                    </KineticText>
                    <KineticText variant="h3" bold color={COLORS.foreground}>
                      {subj.name}
                    </KineticText>
                  </View>

                  <View style={styles.electiveBtn}>
                    {subj.isSelectedElective ? (
                      <StatusBadge status="SAFE" label="ENROLLED" size="sm" />
                    ) : (
                      <StatusBadge status="CANCELLED" label="TAP TO ENROLL" size="sm" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </KineticCard>
          </View>
        )}

        {/* Subject Breakdown Cards */}
        <View style={styles.sectionHeader}>
          <KineticText variant="h1" bold uppercase>
            SUBJECT BREAKDOWN ({subjectSummaries.length})
          </KineticText>
        </View>

        {subjectSummaries.map((sum) => (
          <TouchableOpacity
            key={sum.subjectId}
            activeOpacity={0.9}
            onPress={() => setSelectedSubjectId(selectedSubjectId === sum.subjectId ? null : sum.subjectId)}
          >
            <KineticCard
              style={[
                styles.subjectCard,
                selectedSubjectId === sum.subjectId && styles.activeSubjectCard,
              ]}
            >
              <View style={styles.subjectTop}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <KineticText variant="caption" bold color={COLORS.acidYellow} uppercase>
                    {sum.courseCode}
                  </KineticText>
                  <KineticText variant="h2" bold style={{ marginTop: 2 }}>
                    {sum.subjectName}
                  </KineticText>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
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
                  <StatusBadge status={sum.statusCategory} size="sm" />
                </View>
              </View>

              {/* Attendance Counts */}
              <View style={styles.countsRow}>
                <View style={[styles.countBox, { flex: 1 }]}>
                  <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1}>ATTENDED</KineticText>
                  <KineticText variant="h3" bold color={COLORS.status.safe}>{sum.attended}</KineticText>
                </View>
                <View style={[styles.countBox, { flex: 1 }]}>
                  <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1}>CONDUCTED</KineticText>
                  <KineticText variant="h3" bold>{sum.conducted}</KineticText>
                </View>
                <View style={[styles.countBox, { flex: 1 }]}>
                  <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1}>ABSENT</KineticText>
                  <KineticText variant="h3" bold color={COLORS.status.shortage}>{sum.absent}</KineticText>
                </View>
                <View style={[styles.countBox, { flex: 1 }]}>
                  <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1}>NOT HELD</KineticText>
                  <KineticText variant="h3" bold color={COLORS.status.cancelled}>{sum.cancelled}</KineticText>
                </View>
              </View>

              {/* Prediction Detail */}
              <View style={styles.predictionRow}>
                <Info size={14} color={COLORS.acidYellow} />
                <KineticText
                  variant="caption"
                  bold
                  color={COLORS.foreground}
                  style={{ marginLeft: 6, flex: 1, flexShrink: 1 }}
                >
                  {sum.percentage >= sum.targetPercentage
                    ? `SAFE: You can miss ${sum.safeToMiss} more class${sum.safeToMiss > 1 ? 'es' : ''}.`
                    : `SHORTAGE: Attend next ${sum.classesNeeded} consecutive class${sum.classesNeeded > 1 ? 'es' : ''} to recover to ${sum.targetPercentage}%.`}
                </KineticText>
              </View>

              {/* Untracked Backfill Info & Action Button */}
              <View style={styles.backfillRow}>
                <KineticText variant="caption" color={COLORS.mutedForeground} style={{ flex: 1, flexShrink: 1 }}>
                  Untracked Backfill: <KineticText variant="caption" bold color={COLORS.acidYellow}>{sum.initialAttended || 0}/{sum.initialConducted || 0} Attended</KineticText>
                </KineticText>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditSubject(sum.subjectId)}
                  style={styles.editBackfillBtn}
                >
                  <Edit3 size={13} color={COLORS.acidYellow} />
                  <KineticText variant="caption" bold color={COLORS.acidYellow} style={{ marginLeft: 4 }}>
                    EDIT COUNTS
                  </KineticText>
                </TouchableOpacity>
              </View>
            </KineticCard>
          </TouchableOpacity>
        ))}

        {/* History Log */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <KineticText variant="h1" bold uppercase>
            {selectedSubjectId ? 'SUBJECT LOG' : 'RECENT HISTORY LOG'}
          </KineticText>
        </View>

        {selectedSubjectOccurrences.slice(0, 15).map((occ) => (
          <KineticCard key={occ.id} style={styles.historyCard}>
            <View style={styles.historyTop}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <KineticText variant="h3" bold numberOfLines={1}>
                  {occ.subjectName}
                </KineticText>
                <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1}>
                  {occ.date} • {occ.startTime} ({occ.room})
                </KineticText>
              </View>

              <StatusBadge
                status={
                  occ.status === 'CANCELLED'
                    ? 'CANCELLED'
                    : occ.status === 'PRESENT'
                    ? 'SAFE'
                    : occ.status === 'ABSENT'
                    ? 'SHORTAGE'
                    : 'PENDING'
                }
                label={occ.status === 'CANCELLED' ? `NOT HELD (${occ.notHeldReason || 'CANCELLED'})` : occ.status}
                size="sm"
              />
            </View>
          </KineticCard>
        ))}
      </ScrollView>

      {/* Untracked Attendance Backfill Modal */}
      <Modal visible={!!editingSubject} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
              UNTRACKED ATTENDANCE BACKFILL
            </KineticText>
            <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginTop: 2 }}>
              {editingSubject?.code} • {editingSubject?.name}
            </KineticText>

            <View style={{ marginTop: 16 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                PREVIOUS ATTENDED CLASSES
              </KineticText>
              <TextInput
                style={styles.input}
                value={initAttended}
                onChangeText={setInitAttended}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                PREVIOUS CONDUCTED CLASSES
              </KineticText>
              <TextInput
                style={styles.input}
                value={initConducted}
                onChangeText={setInitConducted}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={styles.modalBtnRow}>
              <KineticButton
                title="CANCEL"
                variant="outline"
                size="sm"
                onPress={() => setEditingSubject(null)}
                style={{ flex: 1 }}
              />
              <KineticButton
                title="SAVE COUNTS"
                variant="primary"
                size="sm"
                onPress={handleSaveInitialAttendance}
                style={{ flex: 1 }}
              />
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    padding: 14,
  },
  predictionBanner: {
    marginBottom: 20,
    padding: 16,
  },
  shortageBanner: {
    borderColor: COLORS.status.shortage,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  electiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSurface,
    marginBottom: 8,
  },
  electiveItemActive: {
    borderColor: COLORS.acidYellow,
    borderWidth: BORDERS.thick,
    backgroundColor: COLORS.mutedSurface,
  },
  electiveBtn: {
    marginLeft: 8,
  },
  subjectCard: {
    marginBottom: 12,
    padding: 14,
  },
  activeSubjectCard: {
    borderColor: COLORS.acidYellow,
    borderWidth: BORDERS.thick,
  },
  subjectTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: BORDERS.thin,
    borderTopColor: COLORS.border,
  },
  countBox: {
    alignItems: 'center',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mutedSurface,
    padding: 8,
    marginTop: 10,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
  },
  backfillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  editBackfillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.mutedSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.acidYellow,
    marginLeft: 8,
  },
  historyCard: {
    marginBottom: 8,
    padding: 12,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardSurface,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.acidYellow,
    padding: 20,
  },
  input: {
    backgroundColor: COLORS.mutedSurface,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    color: COLORS.foreground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});
