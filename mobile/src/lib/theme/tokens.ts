export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  captionStrong: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
} as const;

const lightColors = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceSubtle: '#EEF3F9',
  border: '#D9E2EC',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  primary: '#2563EB',
  primaryForeground: '#FFFFFF',
  destructive: '#DC2626',
  destructiveForeground: '#FFFFFF',
};

const darkColors = {
  background: '#0B1220',
  surface: '#111827',
  surfaceSubtle: '#1F2937',
  border: '#334155',
  textPrimary: '#E2E8F0',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  primary: '#3B82F6',
  primaryForeground: '#FFFFFF',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
};

export const elevation = {
  card: {
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
} as const;

export function getTheme(isDark: boolean) {
  const colors = isDark ? darkColors : lightColors;
  return {
    colors,
    spacing,
    radius,
    typography,
    elevation,
  };
}

export type AppTheme = ReturnType<typeof getTheme>;
