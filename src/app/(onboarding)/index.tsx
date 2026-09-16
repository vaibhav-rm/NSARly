import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../../components/ui/KineticText';
import { KineticButton } from '../../components/ui/KineticButton';
import { KineticCard } from '../../components/ui/KineticCard';
import { COLORS, BORDERS } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { SemesterService } from '../../services/semesterService';
import { TimetableService } from '../../services/timetableService';
import { RVCE_PUBLISHED_TIMETABLE, RVCE_COLLEGE_NAME, RVCE_BRANCH_NAME, RVCE_SEMESTER_NUMBER, RVCE_SECTION, RVCE_ACADEMIC_YEAR } from '../../constants/rvceData';
import { LocalStore } from '../../lib/storage/localStorage';
import { Check } from 'lucide-react-native';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [college, setCollege] = useState(RVCE_COLLEGE_NAME);
  const [academicYear, setAcademicYear] = useState(RVCE_ACADEMIC_YEAR);
  const [branch, setBranch] = useState(RVCE_BRANCH_NAME);
  const [semesterNumber, setSemesterNumber] = useState(String(RVCE_SEMESTER_NUMBER));
  const [section, setSection] = useState(RVCE_SECTION);
  const [targetPct, setTargetPct] = useState('75');
  const [startDate, setStartDate] = useState('2026-09-07');
  const [timetableMode, setTimetableMode] = useState<'RVCE_PRESET' | 'BLANK'>('RVCE_PRESET');
  const [loading, setLoading] = useState(false);

  const handleCompleteOnboarding = async () => {
    if (!college || !branch || !semesterNumber || !section) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const profile = await LocalStore.getProfile();
      const uid = profile?.uid || 'demo_user';
      const semNum = parseInt(semesterNumber, 10) || 5;
      const target = parseFloat(targetPct) || 75;

      // Seed public timetables to Firestore asynchronously
      await TimetableService.seedPublicTimetablesToFirestore();

      if (timetableMode === 'RVCE_PRESET') {
        const newSem = await SemesterService.startNewSemester(uid, {
          collegeName: college,
          academicYear,
          branchName: branch,
          semesterNumber: semNum,
          section,
          targetPercentage: target,
          startDate,
          endDate: '2026-12-31',
          copySubjects: RVCE_PUBLISHED_TIMETABLE.subjects,
        });

        await TimetableService.importPublishedTimetable(uid, newSem.id, RVCE_PUBLISHED_TIMETABLE);
      } else {
        await SemesterService.startNewSemester(uid, {
          collegeName: college,
          academicYear,
          branchName: branch,
          semesterNumber: semNum,
          section,
          targetPercentage: target,
          startDate,
          endDate: '2026-12-31',
        });
      }

      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Setup Error', err.message || 'Could not complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <KineticText variant="caption" bold uppercase color={COLORS.acidYellow}>
            STEP {step} OF 2
          </KineticText>
          <KineticText variant="h1" bold uppercase style={{ marginTop: 4 }}>
            {step === 1 ? 'ACADEMIC DETAILS' : 'TIMETABLE & TARGET'}
          </KineticText>
          <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
            {step === 1
              ? 'Configure your college, branch, semester, and section.'
              : 'Set your attendance target percentage and choose a timetable.'}
          </KineticText>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <View style={styles.field}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                COLLEGE NAME
              </KineticText>
              <TextInput
                style={styles.input}
                value={college}
                onChangeText={setCollege}
                placeholder="e.g. RV College of Engineering"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={styles.field}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                ACADEMIC YEAR
              </KineticText>
              <TextInput
                style={styles.input}
                value={academicYear}
                onChangeText={setAcademicYear}
                placeholder="e.g. 2026–27"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={styles.field}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                BRANCH / PROGRAM
              </KineticText>
              <TextInput
                style={styles.input}
                value={branch}
                onChangeText={setBranch}
                placeholder="e.g. Computer Science & Engineering"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                  SEMESTER
                </KineticText>
                <TextInput
                  style={styles.input}
                  value={semesterNumber}
                  onChangeText={setSemesterNumber}
                  placeholder="5"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.mutedForeground}
                />
              </View>

              <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                  SECTION
                </KineticText>
                <TextInput
                  style={styles.input}
                  value={section}
                  onChangeText={setSection}
                  placeholder="D"
                  autoCapitalize="characters"
                  placeholderTextColor={COLORS.mutedForeground}
                />
              </View>
            </View>

            <KineticButton
              title="NEXT: TIMETABLE SETUP"
              variant="primary"
              size="lg"
              onPress={() => setStep(2)}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.field}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                ATTENDANCE TARGET (%)
              </KineticText>
              <TextInput
                style={styles.input}
                value={targetPct}
                onChangeText={setTargetPct}
                placeholder="75"
                keyboardType="numeric"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={styles.field}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                SEMESTER START DATE (YYYY-MM-DD)
              </KineticText>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-09-07"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 8, marginTop: 8 }}>
              SELECT INITIAL TIMETABLE
            </KineticText>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTimetableMode('RVCE_PRESET')}
              style={{ marginBottom: 12 }}
            >
              <KineticCard accent={timetableMode === 'RVCE_PRESET'}>
                <View style={styles.optionHeader}>
                  <KineticText variant="h3" bold color={COLORS.foreground}>
                    RECOMMENDED: RVCE CSE 5th Sem Sec D
                  </KineticText>
                  {timetableMode === 'RVCE_PRESET' && <Check size={20} color={COLORS.acidYellow} />}
                </View>
                <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
                  Official public timetable pre-loaded from Firestore (AIML, TOC, DBMS, POME, Electives, Labs & CRB 403 room schedule).
                </KineticText>
              </KineticCard>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setTimetableMode('BLANK')}
              style={{ marginBottom: 16 }}
            >
              <KineticCard accent={timetableMode === 'BLANK'}>
                <View style={styles.optionHeader}>
                  <KineticText variant="h3" bold color={COLORS.foreground}>
                    Start With Blank Timetable
                  </KineticText>
                  {timetableMode === 'BLANK' && <Check size={20} color={COLORS.acidYellow} />}
                </View>
                <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
                  Manually add subjects, faculty, and weekly class slots.
                </KineticText>
              </KineticCard>
            </TouchableOpacity>

            <KineticButton
              title="COMPLETE SETUP & ENTER APP"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleCompleteOnboarding}
            />

            <KineticButton
              title="BACK"
              variant="outline"
              size="md"
              onPress={() => setStep(1)}
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    backgroundColor: COLORS.cardSurface,
    color: COLORS.foreground,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
