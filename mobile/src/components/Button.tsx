import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

const variants = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'outline',
  ghost: 'ghost',
  destructive: 'destructive',
} as const;

type ButtonProps = {
  label: string;
  variant?: keyof typeof variants;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  className?: string;
};

export function Button({ label, variant = 'primary', onPress, disabled, style }: ButtonProps) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      textColor: theme.colors.primaryForeground,
    },
    secondary: {
      backgroundColor: theme.colors.surfaceSubtle,
      borderColor: theme.colors.surfaceSubtle,
      textColor: theme.colors.textPrimary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
      textColor: theme.colors.textPrimary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: theme.colors.textPrimary,
    },
    destructive: {
      backgroundColor: theme.colors.destructive,
      borderColor: theme.colors.destructive,
      textColor: theme.colors.destructiveForeground,
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          opacity: disabled ? 0.55 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: variantStyles.textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
