import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { changePassword } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const mutation = useMutation({
    mutationFn: changePassword,
  });

  const handleChangePassword = () => {
    mutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  return (
    <Screen>
      <View className="gap-6">
        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Appearance</Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-medium text-foreground dark:text-dark-foreground">Dark mode</Text>
              <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">Match the web UI theme.</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Change password</Text>
          <Input
            placeholder="Current password"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <Input
            placeholder="New password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          {mutation.error ? <ErrorState message={(mutation.error as Error).message} /> : null}
          <Button label={mutation.isPending ? 'Updating...' : 'Update password'} onPress={handleChangePassword} />
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Session</Text>
          <Button label="Logout" variant="destructive" onPress={() => signOut()} />
        </Card>
      </View>
    </Screen>
  );
}
