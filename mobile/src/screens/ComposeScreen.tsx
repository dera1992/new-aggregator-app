import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { getTheme } from "@/lib/theme/tokens";
import type { MainTabParamList } from "@/navigation/MainTabs";

export function ComposeScreen() {
  const { isDark } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const theme = getTheme(isDark);

  return (
    <Screen>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Compose
          </Text>
          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
            Use compose tools to summarize, analyze, and draft content from your
            latest stories.
          </Text>
          <Button
            label="Open Feed Stories"
            variant="secondary"
            onPress={() => navigation.navigate("Feed")}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    gap: 12,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
