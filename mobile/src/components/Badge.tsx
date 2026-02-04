import React from 'react';
import { Text, View } from 'react-native';

export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <View className={`rounded-full bg-secondary px-3 py-1 dark:bg-dark-secondary ${className ?? ''}`}>
      <Text className="text-xs font-medium text-secondary-foreground dark:text-dark-secondary-foreground">{label}</Text>
    </View>
  );
}
