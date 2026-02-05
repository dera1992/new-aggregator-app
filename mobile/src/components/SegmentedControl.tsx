import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

export type SegmentOption = {
  value: string;
  label: string;
};

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceSubtle }]}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.option, active && { backgroundColor: theme.colors.surface }]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: active ? theme.colors.textPrimary : theme.colors.textMuted,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  option: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
});
