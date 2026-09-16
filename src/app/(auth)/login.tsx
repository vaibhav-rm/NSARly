import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../../components/ui/KineticText';
import { KineticButton } from '../../components/ui/KineticButton';
import { COLORS, BORDERS } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await AuthService.loginWithGoogle();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.header}>
            <KineticText variant="hero" bold color={COLORS.acidYellow}>
              LOGIN
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
              Enter your student credentials to access your attendance workspace.
            </KineticText>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                STUDENT EMAIL
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
                placeholder="••••••••"
                placeholderTextColor={COLORS.mutedForeground}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotBtn}
            >
              <KineticText variant="caption" color={COLORS.acidYellow} bold uppercase>
                FORGOT PASSWORD?
              </KineticText>
            </TouchableOpacity>

            <KineticButton
              title="LOG IN WITH EMAIL"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: 8 }}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginHorizontal: 8 }}>
                OR
              </KineticText>
              <View style={styles.line} />
            </View>

            <KineticButton
              title="CONTINUE WITH GOOGLE"
              variant="secondary"
              size="lg"
              loading={googleLoading}
              onPress={handleGoogleLogin}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(onboarding)')}
              style={styles.demoBtn}
            >
              <KineticText variant="caption" color={COLORS.mutedForeground} bold uppercase>
                CONTINUE AS DEMO / SKIP TO ONBOARDING
              </KineticText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <KineticText variant="body" color={COLORS.mutedForeground}>
              Don't have an account?{' '}
            </KineticText>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(auth)/signup')}>
              <KineticText variant="body" bold color={COLORS.acidYellow}>
                SIGN UP
              </KineticText>
            </TouchableOpacity>
          </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
  },
  form: {
    marginBottom: 24,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 14,
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
  demoBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
