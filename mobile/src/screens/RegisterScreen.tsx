import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
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

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export function RegisterScreen() {
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
    try {
      await register(values);
      navigation.navigate('Login');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Sign up to customize your daily digest.">
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
      <Button label={isSubmitting ? 'Creating account...' : 'Create account'} disabled={isSubmitting} onPress={handleSubmit(onSubmit)} />
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
