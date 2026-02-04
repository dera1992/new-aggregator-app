import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState({ label }: { label: string }) {
  return (
    <View className="items-center justify-center gap-3 py-8">
      <ActivityIndicator size="small" color="#0084ff" />
      <Text className="text-sm text-muted-foreground dark:text-dark-muted-foreground">{label}</Text>
    </View>
  );
}
