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
import { register } from '@/lib/api/auth';
import type { AuthStackParamList } from '@/navigation/AuthStack';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [error, setError] = useState('');
  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await register(values);
      navigation.navigate('ConfirmEmail');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Sign up to customize your daily digest.">
      <View style={styles.formGroup}>
        <Input
          placeholder="Name"
          value={watch('name')}
          onChangeText={(value) => setValue('name', value)}
        />
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={watch('email')}
          onChangeText={(value) => setValue('email', value)}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          value={watch('password')}
          onChangeText={(value) => setValue('password', value)}
        />
      </View>
      {error ? <ErrorState message={error} /> : null}
      <Button label="Create account" onPress={handleSubmit(onSubmit)} />
      <Button label="Back to login" variant="ghost" onPress={() => navigation.navigate('Login')} />
    </AuthLayout>
  );
}


const styles = StyleSheet.create({
  formGroup: {
    gap: 12,
  },
});
