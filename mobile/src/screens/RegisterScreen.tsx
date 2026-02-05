import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Input } from '@/components/Input';
import { register } from '@/lib/api/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';
import type { AuthStackParamList } from '@/navigation/AuthStack';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export function RegisterScreen() {
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
      await register(parsed.data);
      navigation.navigate('Login');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Sign up to customize your daily digest.">
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
      <Button label={isSubmitting ? 'Creating account...' : 'Create account'} disabled={isSubmitting} onPress={onSubmit} />
      {isSubmitting ? (
        <Text style={[styles.submittingHint, { color: theme.colors.textMuted }]}>
          {`Submitting to ${apiUrl ?? 'EXPO_PUBLIC_API_URL not set'} ...`}
        </Text>
      ) : null}
      <Button label="Back to login" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    gap: 12,
  },
  submittingHint: {
    fontSize: 12,
    lineHeight: 16,
  },
});
