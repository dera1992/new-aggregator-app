import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground dark:border-dark-input dark:bg-dark-background dark:text-dark-foreground"
      {...props}
    />
  );
}
