import React from 'react';
import { Text, View } from 'react-native';

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-6 dark:border-dark-border dark:bg-dark-card">
      <Text className="text-sm font-medium text-foreground dark:text-dark-foreground">Nothing here</Text>
      <Text className="text-xs text-muted-foreground dark:text-dark-muted-foreground">{message}</Text>
    </View>
  );
}
