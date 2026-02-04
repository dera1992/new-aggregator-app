import React from 'react';
import { View } from 'react-native';

export function Skeleton({ className }: { className?: string }) {
  return <View className={`h-4 w-full rounded-md bg-secondary dark:bg-dark-secondary ${className ?? ''}`} />;
}
