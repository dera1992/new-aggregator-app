import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

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

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [error, setError] = useState('');
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const validationError = useMemo(
    () => errors.email?.message ?? errors.password?.message ?? '',
    [errors.email?.message, errors.password?.message],
  );

  const onSubmit = async (values: FormValues) => {
    setError('');

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your inputs.');
      return;
    }

    try {
      const data = await login(parsed.data);
      await signIn(data.token);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to access your personalized news feed.">
      <View style={styles.formGroup}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input placeholder="Password" secureTextEntry value={value} onChangeText={onChange} />
          )}
        />
      </View>
      {validationError ? <ErrorState message={validationError} /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Button label={isSubmitting ? 'Signing in...' : 'Login'} disabled={isSubmitting} onPress={handleSubmit(onSubmit)} />
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
