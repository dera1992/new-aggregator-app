import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from './Screen';
import { Card } from './Card';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { getTheme } from '@/lib/theme/tokens';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <Screen scroll={false} style={styles.screenContent}>
      <View style={styles.wrapper}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
          </View>
          <View style={styles.body}>{children}</View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: 'center',
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    gap: 20,
  },
  header: {
    gap: 8,
  },
  body: {
    gap: 14,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
