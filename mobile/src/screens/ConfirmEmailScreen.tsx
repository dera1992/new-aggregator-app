import React, { useState } from 'react';
import { View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorState } from '@/components/ErrorState';
import { confirmEmail, resendConfirmation } from '@/lib/api/auth';
import type { AuthStackParamList } from '@/navigation/AuthStack';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(4),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function ConfirmEmailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [error, setError] = useState('');
  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', token: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await confirmEmail(values);
      navigation.navigate('Login');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await resendConfirmation({ email: watch('email') });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Confirm your email" subtitle="Enter the verification code from your inbox.">
      <View className="gap-3">
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
      {error ? <ErrorState message={error} /> : null}
      <Button label="Confirm email" onPress={handleSubmit(onSubmit)} />
      <Button label="Resend confirmation" variant="secondary" onPress={handleResend} />
      <Button label="Back to login" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </AuthLayout>
  );
}
