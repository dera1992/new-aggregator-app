import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'news_aggregator_theme';

type ThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (value: 'light' | 'dark') => void;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === 'dark') {
          setIsDark(true);
        }
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const persistTheme = useCallback(async (value: 'light' | 'dark') => {
    setIsDark(value === 'dark');
    await AsyncStorage.setItem(THEME_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    void persistTheme(isDark ? 'light' : 'dark');
  }, [isDark, persistTheme]);

  const value = useMemo(
    () => ({
      isDark,
      toggleTheme,
      setTheme: persistTheme,
      isReady,
    }),
    [isDark, persistTheme, toggleTheme, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
