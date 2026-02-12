import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { getTheme } from "@/lib/theme/tokens";
import type { AuthStackParamList } from "@/navigation/AuthStack";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
};

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$0/mo",
    description: "For individuals exploring the platform.",
    features: ["Daily feed updates", "Basic compose tools", "5 saved drafts"],
  },
  {
    name: "Pro",
    price: "$29/mo",
    description: "For creators and small teams publishing frequently.",
    features: [
      "Unlimited compose",
      "Priority URL imports",
      "Advanced analysis tools",
    ],
  },
  {
    name: "Business",
    price: "$99/mo",
    description: "For teams managing multi-channel operations.",
    features: ["Team workspaces", "Shared defaults", "Premium support"],
  },
];

export function PricingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  return (
    <Screen>
      <View style={styles.container}>
        <Button
          label="← Back to Home"
          variant="outline"
          onPress={() => navigation.navigate("Login")}
        />
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Pricing
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Simple plans for every stage.
          </Text>
        </View>
        {plans.map((plan) => (
          <Card key={plan.name} style={styles.planCard}>
            <Text
              style={[styles.planName, { color: theme.colors.textPrimary }]}
            >
              {plan.name}
            </Text>
            <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
              {plan.price}
            </Text>
            <Text
              style={[styles.planDesc, { color: theme.colors.textSecondary }]}
            >
              {plan.description}
            </Text>
            {plan.features.map((feature) => (
              <Text
                key={`${plan.name}-${feature}`}
                style={[styles.feature, { color: theme.colors.textMuted }]}
              >
                • {feature}
              </Text>
            ))}
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  header: {
    gap: 4,
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
  planCard: {
    gap: 6,
  },
  planName: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  planPrice: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  planDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  feature: {
    fontSize: 12,
    lineHeight: 17,
  },
});
