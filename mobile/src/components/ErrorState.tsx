import React from 'react';
import { Text, View } from 'react-native';

export function ErrorState({ message }: { message: string }) {
  return (
    <View className="rounded-lg border border-destructive/40 bg-red-50 px-4 py-3 dark:bg-dark-card">
      <Text className="text-sm text-destructive">{message}</Text>
    </View>
  );
}
