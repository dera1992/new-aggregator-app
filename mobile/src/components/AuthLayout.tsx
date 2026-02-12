import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "./Screen";
import { Card } from "./Card";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { getTheme } from "@/lib/theme/tokens";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <Screen scroll={false} style={styles.screenContent}>
      <View style={styles.wrapper}>
        <View
          pointerEvents="none"
          style={[
            styles.glowBlue,
            {
              backgroundColor: isDark
                ? "rgba(56, 189, 248, 0.16)"
                : "rgba(74, 144, 226, 0.1)",
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.glowOrange,
            {
              backgroundColor: isDark
                ? "rgba(249, 115, 22, 0.14)"
                : "rgba(255, 102, 0, 0.1)",
            },
          ]}
        />
        <Card
          style={[
            styles.card,
            {
              backgroundColor: isDark
                ? "rgba(17, 24, 39, 0.86)"
                : "rgba(255, 255, 255, 0.88)",
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              {title}
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          </View>
          <View style={styles.body}>{children}</View>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    justifyContent: "center",
  },
  wrapper: {
    flex: 1,
    justifyContent: "center",
  },
  glowBlue: {
    position: "absolute",
    top: -40,
    right: 30,
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  glowOrange: {
    position: "absolute",
    bottom: -30,
    left: 20,
    width: 160,
    height: 160,
    borderRadius: 999,
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
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
});
