import React from 'react';
import { View, Text } from 'react-native';
import { Screen } from './Screen';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Screen scroll>
      <View className="gap-6">
        <View className="gap-2">
          <Text className="text-2xl font-semibold text-foreground dark:text-dark-foreground">{title}</Text>
          <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{subtitle}</Text>
        </View>
        <View className="gap-4">{children}</View>
      </View>
    </Screen>
  );
}
