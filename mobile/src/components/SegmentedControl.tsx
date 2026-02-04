import React from 'react';
import { Pressable, Text, View } from 'react-native';

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
  return (
    <View className="flex-row rounded-lg border border-border bg-secondary p-1 dark:border-dark-border dark:bg-dark-secondary">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`flex-1 rounded-md px-3 py-2 ${active ? 'bg-card dark:bg-dark-card' : ''}`}
          >
            <Text
              className={`text-center text-xs font-semibold ${
                active
                  ? 'text-foreground dark:text-dark-foreground'
                  : 'text-muted-foreground dark:text-dark-muted-foreground'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
