'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  Theme,
  applyTheme,
  clearStoredTheme,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
} from '@/lib/theme';

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    resolveTheme(defaultTheme),
  );

  useEffect(() => {
    const stored = getStoredTheme();
    const initial = stored ?? defaultTheme;
    setThemeState(initial);
    const resolved = resolveTheme(initial);
    setResolvedTheme(resolved);
    applyTheme(initial);
  }, [defaultTheme]);

  useEffect(() => {
    if (theme !== 'system') {
      return undefined;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = resolveTheme('system');
      setResolvedTheme(resolved);
      applyTheme('system');
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    setStoredTheme(nextTheme);
    const resolved = resolveTheme(nextTheme);
    setResolvedTheme(resolved);
    applyTheme(nextTheme);
  };

  const resetTheme = () => {
    clearStoredTheme();
    setThemeState(defaultTheme);
    const resolved = resolveTheme(defaultTheme);
    setResolvedTheme(resolved);
    applyTheme(defaultTheme);
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      resetTheme,
    }),
    [resolvedTheme, theme],
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
