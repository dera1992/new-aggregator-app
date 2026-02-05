import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const onSubmit = async () => {
    setError('');

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your inputs.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(parsed.data);
      await signIn(data.token);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to access your personalized news feed.">
      <View style={styles.formGroup}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      </View>
      {error ? <ErrorState message={error} /> : null}
      <Button label={isSubmitting ? 'Signing in...' : 'Login'} disabled={isSubmitting} onPress={onSubmit} />
      {isSubmitting ? (
        <Text style={[styles.submittingHint, { color: theme.colors.textMuted }]}>
          {`Submitting to ${apiUrl ?? 'EXPO_PUBLIC_API_URL not set'} ...`}
        </Text>
      ) : null}
      <View style={styles.secondaryActions}>
        <Button label="Create account" variant="secondary" onPress={() => navigation.navigate('Register')} />
        <Button label="Forgot password" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
      </View>
      <Text style={[styles.legalText, { color: theme.colors.textMuted }]}>By continuing you agree to the News Aggregator terms.</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    gap: 12,
  },
  secondaryActions: {
    gap: 10,
  },
  legalText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  submittingHint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
