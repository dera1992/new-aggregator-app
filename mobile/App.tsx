import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';

import { RootNavigator } from '@/navigation/RootNavigator';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeProvider';

const queryClient = new QueryClient();

function AppContent() {
  const { isDark } = useTheme();
  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'}>
      <RootNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
