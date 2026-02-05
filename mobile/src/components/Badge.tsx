import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

export function Badge({ label }: { label: string; className?: string }) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.surfaceSubtle }]}>
      <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});
