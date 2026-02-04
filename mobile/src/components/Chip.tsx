import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <Pressable
      className="flex-row items-center gap-1 rounded-full border border-border bg-secondary px-3 py-1 dark:border-dark-border dark:bg-dark-secondary"
      onPress={onRemove}
    >
      <Text className="text-xs text-secondary-foreground dark:text-dark-secondary-foreground">{label}</Text>
      {onRemove ? <Ionicons name="close" size={14} color="#64748b" /> : null}
    </Pressable>
  );
}
