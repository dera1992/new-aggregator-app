import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

export function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceSubtle,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onRemove}
    >
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      {onRemove ? <Ionicons name="close" size={14} color={theme.colors.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
