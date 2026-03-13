import React, { useEffect, useState } from 'react';
import { Linking, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Screen } from '@/components/Screen';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { changePassword } from '@/lib/api/auth';
import { fetchProfile, updateProfile } from '@/lib/api/profile';
import { createCheckoutSession, createPortalSession } from '@/lib/api/billing';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState('');

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (profileQuery.data) {
      setFullName(profileQuery.data.full_name ?? '');
      setTimezone(profileQuery.data.timezone ?? '');
    }
  }, [profileQuery.data]);

  const passwordMutation = useMutation({ mutationFn: changePassword });

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => Linking.openURL(data.url),
  });

  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (data) => Linking.openURL(data.url),
  });

  const profile = profileQuery.data;
  const isSubscribed =
    profile?.subscription_tier !== 'free' &&
    profile?.subscription_tier != null &&
    profile?.subscription_status === 'active';

  const subscriptionLabel = profile
    ? `${(profile.subscription_tier ?? 'free').charAt(0).toUpperCase() + (profile.subscription_tier ?? 'free').slice(1)} · ${profile.subscription_status ?? 'inactive'}`
    : '—';

  return (
    <Screen refreshing={profileQuery.isLoading} onRefresh={() => profileQuery.refetch()}>
      <View className="gap-6">

        {/* Profile */}
        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Profile</Text>
          {profileQuery.isLoading ? (
            <LoadingState label="Loading profile" />
          ) : (
            <>
              <Input placeholder="Full name" value={fullName} onChangeText={setFullName} />
              <Input placeholder="Timezone (e.g. UTC, America/New_York)" value={timezone} onChangeText={setTimezone} />
              {profileMutation.error ? <ErrorState message={(profileMutation.error as Error).message} /> : null}
              {profileMutation.isSuccess ? (
                <Text className="text-xs text-green-600">Profile saved.</Text>
              ) : null}
              <Button
                label={profileMutation.isPending ? 'Saving...' : 'Save profile'}
                variant="secondary"
                onPress={() => profileMutation.mutate({ full_name: fullName, timezone })}
              />
            </>
          )}
        </Card>

        {/* Subscription */}
        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Subscription</Text>
          {profile ? (
            <>
              <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">
                Current plan: <Text className="font-semibold text-foreground dark:text-dark-foreground">{subscriptionLabel}</Text>
              </Text>
              {profile.subscription_expires_at ? (
                <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
                  Renews: {new Date(profile.subscription_expires_at).toLocaleDateString()}
                </Text>
              ) : null}
              {isSubscribed ? (
                <Button
                  label={portalMutation.isPending ? 'Opening...' : 'Manage subscription'}
                  variant="secondary"
                  onPress={() => portalMutation.mutate()}
                />
              ) : (
                <View className="gap-2">
                  <Button
                    label={checkoutMutation.isPending ? 'Opening...' : 'Upgrade to Pro — $29/mo'}
                    variant="secondary"
                    onPress={() => checkoutMutation.mutate('pro')}
                  />
                  <Button
                    label={checkoutMutation.isPending ? 'Opening...' : 'Upgrade to Business — $99/mo'}
                    variant="outline"
                    onPress={() => checkoutMutation.mutate('business')}
                  />
                </View>
              )}
              {checkoutMutation.error ? <ErrorState message={(checkoutMutation.error as Error).message} /> : null}
              {portalMutation.error ? <ErrorState message={(portalMutation.error as Error).message} /> : null}
            </>
          ) : null}
        </Card>

        {/* Appearance */}
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

        {/* Change Password */}
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
          {passwordMutation.error ? <ErrorState message={(passwordMutation.error as Error).message} /> : null}
          {passwordMutation.isSuccess ? (
            <Text className="text-xs text-green-600">Password updated.</Text>
          ) : null}
          <Button
            label={passwordMutation.isPending ? 'Updating...' : 'Update password'}
            onPress={() => passwordMutation.mutate({ current_password: currentPassword, new_password: newPassword })}
          />
        </Card>

        {/* Session */}
        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground dark:text-dark-foreground">Session</Text>
          <Button label="Logout" variant="destructive" onPress={() => signOut()} />
        </Card>

      </View>
    </Screen>
  );
}
