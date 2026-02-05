import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

export function Input(props: TextInputProps) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      style={[
        styles.input,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          color: theme.colors.textPrimary,
        },
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
});
