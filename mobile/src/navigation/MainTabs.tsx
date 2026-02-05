import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { FeedScreen } from '@/screens/FeedScreen';
import { ArchiveScreen } from '@/screens/ArchiveScreen';
import { SavedScreen } from '@/screens/SavedScreen';
import { ReadScreen } from '@/screens/ReadScreen';
import { PreferencesScreen } from '@/screens/PreferencesScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export type MainTabParamList = {
  Feed: undefined;
  Archive: undefined;
  Saved: undefined;
  Read: undefined;
  Preferences: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Feed"
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarStyle: { height: 60 },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 6 },
        tabBarActiveTintColor: '#0084ff',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Feed: 'newspaper',
            Archive: 'archive',
            Saved: 'bookmark',
            Read: 'checkmark-circle',
            Preferences: 'options',
            Settings: 'settings',
          };
          const name = icons[route.name] ?? 'ellipse';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Archive" component={ArchiveScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Read" component={ReadScreen} />
      <Tab.Screen name="Preferences" component={PreferencesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
