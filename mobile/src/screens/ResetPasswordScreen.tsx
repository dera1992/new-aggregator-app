import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorState } from '@/components/ErrorState';
import { resetPassword } from '@/lib/api/auth';
import type { AuthStackParamList } from '@/navigation/AuthStack';

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(6),
  newPassword: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function ResetPasswordScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [error, setError] = useState('');
  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', token: '', newPassword: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await resetPassword({
        email: values.email,
        token: values.token,
        new_password: values.newPassword,
      });
      navigation.navigate('Login');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Paste your reset token to continue.">
      <View style={styles.formGroup}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={watch('email')}
          onChangeText={(value) => setValue('email', value)}
        />
        <Input
          placeholder="Reset token"
          value={watch('token')}
          onChangeText={(value) => setValue('token', value)}
        />
        <Input
          placeholder="New password"
          secureTextEntry
          value={watch('newPassword')}
          onChangeText={(value) => setValue('newPassword', value)}
        />
      </View>
      {error ? <ErrorState message={error} /> : null}
      <Button label="Update password" onPress={handleSubmit(onSubmit)} />
      <Button label="Back to login" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </AuthLayout>
  );
}


const styles = StyleSheet.create({
  formGroup: {
    gap: 12,
  },
});
