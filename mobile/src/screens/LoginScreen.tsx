import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';

import { AuthLayout } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ErrorState } from '@/components/ErrorState';
import { login } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { AuthStackParamList } from '@/navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [error, setError] = useState('');
  const { handleSubmit, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      const data = await login(values);
      await signIn(data.token);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to access your personalized news feed.">
      <View className="gap-3">
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
      <Button label="Login" onPress={handleSubmit(onSubmit)} />
      <View className="gap-3">
        <Button label="Create account" variant="secondary" onPress={() => navigation.navigate('Register')} />
        <Button label="Forgot password" variant="ghost" onPress={() => navigation.navigate('ForgotPassword')} />
        <Button label="Confirm email" variant="ghost" onPress={() => navigation.navigate('ConfirmEmail')} />
      </View>
      <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
        By continuing you agree to the News Aggregator terms.
      </Text>
    </AuthLayout>
  );
}
