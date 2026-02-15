import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ActivityIndicator, View } from 'react-native';
import { StoryDetailScreen } from '@/screens/StoryDetailScreen';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { navigationRef, resetToRoot, RootStackParamList } from './root-navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { token, isReady } = useAuth();
  const { isDark, isReady: themeReady } = useTheme();

  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#020817',
          card: '#0b1220',
          text: '#f8fafc',
          border: '#1e293b',
          primary: '#0084ff',
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#ffffff',
          card: '#ffffff',
          text: '#0f172a',
          border: '#e2e8f0',
          primary: '#0084ff',
        },
      };

  useEffect(() => {
    console.log('🔍 Navigation effect triggered');
    console.log('🔍 navigationRef.isReady():', navigationRef.isReady());
    console.log('🔍 token exists:', !!token);

    if (!navigationRef.isReady()) {
      console.log('⏳ Navigation not ready yet, skipping...');
      return;
    }

    const currentRouteName = navigationRef.getCurrentRoute()?.name;
    console.log('🔍 Current route:', currentRouteName);

    if (token && currentRouteName !== 'Main' && currentRouteName !== 'StoryDetail') {
      console.log('✅ Navigating to Main (user has token)');
      resetToRoot('Main');
    }

    if (!token && currentRouteName !== 'Auth') {
      console.log('✅ Navigating to Auth (no token)');
      resetToRoot('Auth');
    }
  }, [token]);

  if (!isReady || !themeReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background">
        <ActivityIndicator size="small" color="#0084ff" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      onReady={() => {
        console.log('🎯 NavigationContainer ready');
        console.log('🎯 Token exists:', !!token);

        if (token) {
          console.log('🎯 Initial navigation: Main');
          resetToRoot('Main');
        } else {
          console.log('🎯 Initial navigation: Auth');
          resetToRoot('Auth');
        }
      }}
    >
      <Stack.Navigator
        key={token ? 'main' : 'auth'}
        screenOptions={{ headerShown: false }}
      >
        {token ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="StoryDetail" component={StoryDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}