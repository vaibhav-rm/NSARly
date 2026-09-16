import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { KineticText } from '../../components/ui/KineticText';
import { KineticCard } from '../../components/ui/KineticCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, BORDERS } from '../../constants/theme';
import { LocalStore } from '../../lib/storage/localStorage';
import { calculateSubjectSummary, calculateOverallSummary, getActiveMainSubjects } from '../../lib/attendance/calculator';
import { SubjectSummary, ClassOccurrence, OverallSummary } from '../../types/attendance';
import { Subject } from '../../types/timetable';
import { ShieldCheck, AlertOctagon, Info } from 'lucide-react-native';

export default function AttendanceScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [occurrences, setOccurrences] = useState<ClassOccurrence[]>([]);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);
  const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const prof = await LocalStore.getProfile();
    const semId = prof?.currentSemesterId || 'sem_rvce_5_d';
    const subjs = await LocalStore.getSubjects(semId);
    const occs = await LocalStore.getOccurrences(semId);

    setSubjects(subjs);
    setOccurrences(occs);

    const target = 75;
    const activeSubjs = getActiveMainSubjects(subjs);
    setOverallSummary(calculateOverallSummary(subjs, occs, target));
    setSubjectSummaries(
      activeSubjs.map((s) => calculateSubjectSummary(s, occs, target, { countExcusedAsAttended: false }, subjs))
    );
  }, []);

  // Auto-reload whenever tab gains focus so changes in Settings reflect immediately
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

  const selectedSubjectOccurrences = selectedSubjectId
    ? occurrences.filter((o) => o.subjectId === selectedSubjectId)
    : occurrences;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
          ATTENDANCE HUB
        </KineticText>
        <KineticText variant="caption" color={COLORS.mutedForeground}>
          Target Predictor, Subject Breakdown & Class History Log
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
                PREDICTOR STATUS
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

              {sum.initialConducted ? (
                <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginTop: 6, fontStyle: 'italic' }}>
                  Includes {sum.initialAttended || 0}/{sum.initialConducted} untracked past classes backfilled.
                </KineticText>
              ) : null}
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
  historyCard: {
    marginBottom: 8,
    padding: 12,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
