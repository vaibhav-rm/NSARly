import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../../components/ui/KineticText';
import { KineticButton } from '../../components/ui/KineticButton';
import { COLORS, BORDERS } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/authService';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.signup(name, email, password);
      router.replace('/(onboarding)');
    } catch (err: any) {
      Alert.alert('Signup Error', err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await AuthService.loginWithGoogle();
      router.replace('/(onboarding)');
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Could not sign up with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <KineticText variant="hero" bold color={COLORS.acidYellow}>
            CREATE ACCOUNT
          </KineticText>
          <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
            Join NSARly and take full control of your college attendance.
          </KineticText>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
              FULL NAME
            </KineticText>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor={COLORS.mutedForeground}
            />
          </View>

          <View style={styles.field}>
            <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
              EMAIL ADDRESS
            </KineticText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="student@rvce.edu.in"
              placeholderTextColor={COLORS.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
              PASSWORD
            </KineticText>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 characters"
              placeholderTextColor={COLORS.mutedForeground}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
              CONFIRM PASSWORD
            </KineticText>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor={COLORS.mutedForeground}
              secureTextEntry
            />
          </View>

          <KineticButton
            title="CREATE ACCOUNT"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSignup}
            style={{ marginTop: 12 }}
          />

          <View style={styles.divider}>
            <View style={styles.line} />
            <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginHorizontal: 8 }}>
              OR
            </KineticText>
            <View style={styles.line} />
          </View>

          <KineticButton
            title="SIGN UP WITH GOOGLE"
            variant="secondary"
            size="lg"
            loading={googleLoading}
            onPress={handleGoogleSignup}
          />
        </View>

        <View style={styles.footer}>
          <KineticText variant="body" color={COLORS.mutedForeground}>
            Already have an account?{' '}
          </KineticText>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/login')}>
            <KineticText variant="body" bold color={COLORS.acidYellow}>
              LOG IN
            </KineticText>
          </TouchableOpacity>
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
  container: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  field: {
    marginBottom: 14,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
});
