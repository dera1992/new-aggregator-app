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
import { forgotPassword } from '@/lib/api/auth';
import type { AuthStackParamList } from '@/navigation/AuthStack';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [error, setError] = useState('');
  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await forgotPassword(values);
      navigation.navigate('ResetPassword');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll email you a reset link and token.">
      <View className="gap-3">
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={watch('email')}
          onChangeText={(value) => setValue('email', value)}
        />
      </View>
      {error ? <ErrorState message={error} /> : null}
      <Button label="Send reset email" onPress={handleSubmit(onSubmit)} />
      <Button label="Back to login" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </AuthLayout>
  );
}
