import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorState } from '@/components/ErrorState';
import { confirmEmail, resendConfirmation } from '@/lib/api/auth';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';
import type { AuthStackParamList } from '@/navigation/AuthStack';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(4),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type ConfirmRouteProp = RouteProp<AuthStackParamList, 'ConfirmEmail'>;

export function ConfirmEmailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ConfirmRouteProp>();
  const [error, setError] = useState('');
  const [info, setInfo] = useState(route.params?.message ?? '');
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: route.params?.email ?? '', token: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    setInfo('');
    try {
      await confirmEmail(values);
      navigation.replace('Login', {
        message: 'Email confirmed successfully. You can now log in.',
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      await resendConfirmation({ email: watch('email') });
      setInfo('Confirmation email sent. Check your inbox/spam folder for the token.');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Confirm your email" subtitle="Enter the verification code from your inbox.">
      <View style={styles.formGroup}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={watch('email')}
          onChangeText={(value) => setValue('email', value)}
        />
        <Input
          placeholder="Confirmation token"
          value={watch('token')}
          onChangeText={(value) => setValue('token', value)}
        />
      </View>
      {info ? <Text style={[styles.infoText, { color: theme.colors.primary }]}>{info}</Text> : null}
      {error ? <ErrorState message={error} /> : null}
      <Button label="Confirm email" onPress={handleSubmit(onSubmit)} />
      <Button label="Resend confirmation" variant="secondary" onPress={handleResend} />
      <Button label="Back to login" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
