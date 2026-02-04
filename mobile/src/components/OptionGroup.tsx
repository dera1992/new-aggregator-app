import React from 'react';
import { Pressable, Text, View } from 'react-native';

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-muted-foreground dark:text-dark-muted-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`rounded-full border px-3 py-1 ${
                active
                  ? 'border-primary bg-primary'
                  : 'border-border bg-secondary dark:border-dark-border dark:bg-dark-secondary'
              }`}
            >
              <Text
                className={`text-xs ${
                  active
                    ? 'text-primary-foreground'
                    : 'text-secondary-foreground dark:text-dark-secondary-foreground'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
