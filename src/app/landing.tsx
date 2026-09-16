import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../components/ui/KineticText';
import { KineticButton } from '../components/ui/KineticButton';
import { KineticCard } from '../components/ui/KineticCard';
import { COLORS, BORDERS } from '../constants/theme';
import { useRouter } from 'expo-router';
import { ShieldCheck, Calendar, Bell, Layers } from 'lucide-react-native';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Banner */}
        <View style={styles.brandHeader}>
          <KineticText variant="h2" bold color={COLORS.acidYellow}>
            NSAR<KineticText variant="h2" color={COLORS.foreground}>ly</KineticText>
          </KineticText>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroSection}>
          <KineticText variant="hero" bold color={COLORS.foreground} style={styles.heroTitle}>
            STOP GUESSING. {'\n'}
            <KineticText variant="hero" bold color={COLORS.acidYellow}>
              START TRACKING.
            </KineticText>
          </KineticText>

          <KineticText variant="body" color={COLORS.mutedForeground} style={styles.heroSubtitle}>
            Your timetable. Your classes. Your attendance. One system. Built for college students who value accuracy.
          </KineticText>

          <View style={styles.heroNumberCard}>
            <KineticText variant="caption" bold uppercase color={COLORS.acidYellow}>
              LIVE PREDICTOR ENGINE
            </KineticText>
            <KineticText variant="hero" bold color={COLORS.acidYellow} style={{ fontSize: 68, lineHeight: 72 }}>
              78.4%
            </KineticText>
            <KineticText variant="h3" bold color={COLORS.status.safe}>
              SAFE TO MISS 4 CLASSES
            </KineticText>
          </View>

          <View style={styles.ctaGroup}>
            <KineticButton
              title="START TRACKING"
              variant="primary"
              size="lg"
              onPress={() => router.push('/(auth)/signup')}
              style={{ marginBottom: 12 }}
            />
            <KineticButton
              title="EXPLORE FEATURES"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(tabs)')}
            />
          </View>
        </View>

        {/* Features Showcase */}
        <View style={styles.featureSection}>
          <KineticText variant="h1" bold uppercase color={COLORS.foreground} style={styles.sectionTitle}>
            CORE ENGINE FEATURES
          </KineticText>

          <KineticCard style={styles.featureCard}>
            <ShieldCheck size={28} color={COLORS.acidYellow} />
            <KineticText variant="h2" bold style={{ marginTop: 8 }}>
              75% Attendance Predictor
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
              Instantly calculates exact classes safe to miss or consecutive classes needed to recover above your target percentage.
            </KineticText>
          </KineticCard>

          <KineticCard style={styles.featureCard}>
            <Calendar size={28} color={COLORS.acidYellow} />
            <KineticText variant="h2" bold style={{ marginTop: 8 }}>
              Lecturer Skipped Class
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
              Mark classes as Cancelled / Not Held with reasons (Lecturer absent, event, holiday) without penalizing your percentage.
            </KineticText>
          </KineticCard>

          <KineticCard style={styles.featureCard}>
            <Layers size={28} color={COLORS.acidYellow} />
            <KineticText variant="h2" bold style={{ marginTop: 8 }}>
              Multi-Semester Rollover
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
              Seamlessly transition between semesters while preserving complete historical records and subject data.
            </KineticText>
          </KineticCard>

          <KineticCard style={styles.featureCard}>
            <Bell size={28} color={COLORS.acidYellow} />
            <KineticText variant="h2" bold style={{ marginTop: 8 }}>
              Smart Reminders
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
              Receive upcoming class notifications and critical attendance shortage warnings on your device.
            </KineticText>
          </KineticCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  brandHeader: {
    paddingVertical: 16,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroTitle: {
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  heroNumberCard: {
    backgroundColor: COLORS.cardSurface,
    padding: 20,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.acidYellow,
    marginBottom: 24,
  },
  ctaGroup: {
    marginTop: 8,
  },
  featureSection: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  featureCard: {
    marginBottom: 14,
  },
});
