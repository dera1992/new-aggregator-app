import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View className="rounded-lg border border-border bg-card dark:border-dark-border dark:bg-dark-card">
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        className="flex-row items-center justify-between px-4 py-3"
      >
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
      </Pressable>
      {open ? (
        <View className="border-t border-border px-4 py-3 dark:border-dark-border">{children}</View>
      ) : null}
    </View>
  );
}
