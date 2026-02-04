const colors = {
  background: '#ffffff',
  foreground: '#0f172a',
  card: '#ffffff',
  cardForeground: '#0f172a',
  popover: '#ffffff',
  popoverForeground: '#0f172a',
  primary: '#0084ff',
  primaryHover: '#006acc',
  primaryForeground: '#ffffff',
  secondary: '#f1f5f9',
  secondaryHover: '#e2e8f0',
  secondaryForeground: '#0f172a',
  success: '#16a34a',
  successForeground: '#ffffff',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  accent: '#f1f5f9',
  accentForeground: '#0f172a',
  destructive: '#ef4444',
  destructiveForeground: '#f8fafc',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#0084ff',
};

const darkColors = {
  background: '#020817',
  foreground: '#f8fafc',
  card: '#0b1220',
  cardForeground: '#f8fafc',
  popover: '#0b1220',
  popoverForeground: '#f8fafc',
  primary: '#0084ff',
  primaryHover: '#0072e5',
  primaryForeground: '#ffffff',
  secondary: '#1e293b',
  secondaryHover: '#334155',
  secondaryForeground: '#f8fafc',
  success: '#22c55e',
  successForeground: '#f8fafc',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  accent: '#1e293b',
  accentForeground: '#f8fafc',
  destructive: '#7f1d1d',
  destructiveForeground: '#f8fafc',
  border: '#1e293b',
  input: '#1e293b',
  ring: '#0084ff',
};

module.exports = {
  content: ['./App.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: colors.border,
        input: colors.input,
        ring: colors.ring,
        background: colors.background,
        foreground: colors.foreground,
        primary: {
          DEFAULT: colors.primary,
          foreground: colors.primaryForeground,
          hover: colors.primaryHover,
        },
        secondary: {
          DEFAULT: colors.secondary,
          foreground: colors.secondaryForeground,
          hover: colors.secondaryHover,
        },
        success: {
          DEFAULT: colors.success,
          foreground: colors.successForeground,
        },
        muted: {
          DEFAULT: colors.muted,
          foreground: colors.mutedForeground,
        },
        accent: {
          DEFAULT: colors.accent,
          foreground: colors.accentForeground,
        },
        destructive: {
          DEFAULT: colors.destructive,
          foreground: colors.destructiveForeground,
        },
        card: {
          DEFAULT: colors.card,
          foreground: colors.cardForeground,
        },
        popover: {
          DEFAULT: colors.popover,
          foreground: colors.popoverForeground,
        },
        dark: {
          border: darkColors.border,
          input: darkColors.input,
          ring: darkColors.ring,
          background: darkColors.background,
          foreground: darkColors.foreground,
          primary: {
            DEFAULT: darkColors.primary,
            foreground: darkColors.primaryForeground,
            hover: darkColors.primaryHover,
          },
          secondary: {
            DEFAULT: darkColors.secondary,
            foreground: darkColors.secondaryForeground,
            hover: darkColors.secondaryHover,
          },
          success: {
            DEFAULT: darkColors.success,
            foreground: darkColors.successForeground,
          },
          muted: {
            DEFAULT: darkColors.muted,
            foreground: darkColors.mutedForeground,
          },
          accent: {
            DEFAULT: darkColors.accent,
            foreground: darkColors.accentForeground,
          },
          destructive: {
            DEFAULT: darkColors.destructive,
            foreground: darkColors.destructiveForeground,
          },
          card: {
            DEFAULT: darkColors.card,
            foreground: darkColors.cardForeground,
          },
          popover: {
            DEFAULT: darkColors.popover,
            foreground: darkColors.popoverForeground,
          },
        },
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
    },
  },
  plugins: [],
};
