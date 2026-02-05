import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, StyleSheet } from 'react-native';

import { RootNavigator } from '@/navigation/RootNavigator';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeProvider';

const queryClient = new QueryClient();

function AppContent() {
  const { isDark } = useTheme();
  return (
    <View style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

