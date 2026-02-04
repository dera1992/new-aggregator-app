import React from 'react';
import { View } from 'react-native';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-lg border border-border bg-card p-4 dark:border-dark-border dark:bg-dark-card ${className ?? ''}`}
    >
      {children}
    </View>
  );
}
