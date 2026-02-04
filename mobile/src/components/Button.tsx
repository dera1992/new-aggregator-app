import React from 'react';
import { Pressable, Text } from 'react-native';

const variants = {
  primary: 'bg-primary',
  secondary: 'bg-secondary dark:bg-dark-secondary',
  outline: 'border border-border bg-transparent dark:border-dark-border',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive',
};

const textVariants = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground dark:text-dark-secondary-foreground',
  outline: 'text-foreground dark:text-dark-foreground',
  ghost: 'text-foreground dark:text-dark-foreground',
  destructive: 'text-destructive-foreground',
};

type ButtonProps = {
  label: string;
  variant?: keyof typeof variants;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
};

export function Button({ label, variant = 'primary', onPress, disabled, className }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center justify-center rounded-md px-4 py-3 ${variants[variant]} ${
        disabled ? 'opacity-60' : ''
      } ${className ?? ''}`}
    >
      <Text className={`text-sm font-semibold ${textVariants[variant]}`}>{label}</Text>
    </Pressable>
  );
}
