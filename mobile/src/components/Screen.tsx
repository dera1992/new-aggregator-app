import React from 'react';
import { RefreshControl, SafeAreaView, ScrollView, View } from 'react-native';

export function Screen({
  children,
  scroll = true,
  className,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
        <ScrollView
          contentContainerClassName={`px-4 py-6 ${className ?? ''}`}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background">
      <View className={`flex-1 px-4 py-6 ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
