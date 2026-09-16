import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../../components/ui/KineticText';
import { KineticButton } from '../../components/ui/KineticButton';
import { COLORS, BORDERS } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { AuthService } from '../../services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.resetPassword(email);
      Alert.alert('Success', 'Password reset instructions sent to your email.');
      router.back();
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <KineticText variant="hero" bold color={COLORS.acidYellow}>
            RESET PASSWORD
          </KineticText>
          <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4 }}>
            Enter your registered email address to receive password reset instructions.
          </KineticText>
        </View>

        <View style={styles.form}>
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

          <KineticButton
            title="SEND RESET LINK"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleReset}
            style={{ marginTop: 12 }}
          />

          <KineticButton
            title="BACK TO LOGIN"
            variant="outline"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: 12 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
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
});
