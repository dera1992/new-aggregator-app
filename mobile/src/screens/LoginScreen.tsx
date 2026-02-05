import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import type { FieldErrors } from 'react-hook-form';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
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
    handleSubmit,
    setValue,
    watch,
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

    const requestPayload = {
      email: values.email.trim(),
      password: values.password,
    };

    // eslint-disable-next-line no-console
    console.log('[auth][login] submit pressed payload:', {
      email: requestPayload.email,
      passwordLength: requestPayload.password.length,
      apiUrl: apiUrl ?? 'EXPO_PUBLIC_API_URL not set',
    });

    try {
      const data = await login(requestPayload);
      await signIn(data.token);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onInvalid = (formErrors: FieldErrors<FormValues>) => {
    // eslint-disable-next-line no-console
    console.log('[auth][login] submit blocked by validation errors:', formErrors);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to access your personalized news feed.">
      <View style={styles.formGroup}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={watch('email')}
          onChangeText={(value) => setValue('email', value, { shouldDirty: true, shouldValidate: false })}
          editable={!isSubmitting}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          value={watch('password')}
          onChangeText={(value) => setValue('password', value, { shouldDirty: true, shouldValidate: false })}
          editable={!isSubmitting}
        />
      </View>
      {validationError ? <ErrorState message={validationError} /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Button label={isSubmitting ? 'Signing in...' : 'Login'} disabled={isSubmitting} onPress={handleSubmit(onSubmit, onInvalid)} />
      {isSubmitting ? (
        <Text style={[styles.submittingHint, { color: theme.colors.textMuted }]}>
          {`Submitting to ${apiUrl ?? 'EXPO_PUBLIC_API_URL not set'} ...`}
        </Text>
      ) : null}
      <View style={styles.secondaryActions}>
        <Button label="Create account" variant="secondary" disabled={isSubmitting} onPress={() => navigation.navigate('Register')} />
        <Button label="Forgot password" variant="ghost" disabled={isSubmitting} onPress={() => navigation.navigate('ForgotPassword')} />
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
