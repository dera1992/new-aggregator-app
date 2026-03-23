import React, { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createCheckoutSession } from "@/lib/api/billing";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { getTheme } from "@/lib/theme/tokens";
import type { AuthStackParamList } from "@/navigation/AuthStack";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type Plan = "pro" | "business";

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  plan: Plan | null;
  cta: string;
};

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "For individuals exploring the platform.",
    features: ["Daily feed updates", "Basic compose tools", "10 AI credits/month"],
    plan: null,
    cta: "Get started free",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For creators and small teams publishing frequently.",
    features: [
      "Unlimited AI generations",
      "Priority article + YouTube URL imports",
      "Advanced analysis and viral tools",
    ],
    highlighted: true,
    plan: "pro",
    cta: "Get Pro",
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    description: "For teams managing multi-channel news operations.",
    features: ["Everything in Pro", "Team workspaces", "Shared prompt defaults", "Premium support"],
    plan: "business",
    cta: "Get Business",
  },
];

export function PricingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  const handlePlanPress = async (plan: Plan | null) => {
    if (!plan) {
      navigation.navigate("Register");
      return;
    }
    setLoadingPlan(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      await Linking.openURL(url);
    } catch {
      // Not logged in or API error — redirect to login
      navigation.navigate("Login");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Button
          label="← Back to login"
          variant="outline"
          onPress={() => navigation.navigate("Login")}
        />
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Pricing
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Simple pricing for every stage. Upgrade any time.
          </Text>
        </View>

        {plans.map((plan) => (
          <Card
            key={plan.name}
            style={[
              styles.planCard,
              plan.highlighted && { borderColor: theme.colors.primary, borderWidth: 2 },
            ]}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, { color: theme.colors.textPrimary }]}>
                {plan.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
                  {plan.price}
                </Text>
                <Text style={[styles.planPeriod, { color: theme.colors.textMuted }]}>
                  {plan.period}
                </Text>
              </View>
              <Text style={[styles.planDesc, { color: theme.colors.textSecondary }]}>
                {plan.description}
              </Text>
            </View>
            <View style={styles.featureList}>
              {plan.features.map((feature) => (
                <Text
                  key={`${plan.name}-${feature}`}
                  style={[styles.feature, { color: theme.colors.textMuted }]}
                >
                  ✓ {feature}
                </Text>
              ))}
            </View>
            <Button
              label={loadingPlan === plan.plan && plan.plan !== null ? "Opening..." : plan.cta}
              variant={plan.highlighted ? "secondary" : "outline"}
              onPress={() => handlePlanPress(plan.plan)}
              disabled={loadingPlan !== null}
            />
          </Card>
        ))}

        <Text style={[styles.signInNote, { color: theme.colors.textMuted }]}>
          Already have an account?{" "}
          <Text
            style={{ color: theme.colors.primary }}
            onPress={() => navigation.navigate("Login")}
          >
            Sign in
          </Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  header: { gap: 6 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  subtitle: { fontSize: 14, lineHeight: 20 },
  planCard: { gap: 12 },
  planHeader: { gap: 4 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  planName: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  planPrice: { fontSize: 22, lineHeight: 28, fontWeight: "700" },
  planPeriod: { fontSize: 13, lineHeight: 20, paddingBottom: 2 },
  planDesc: { fontSize: 13, lineHeight: 18 },
  featureList: { gap: 4 },
  feature: { fontSize: 13, lineHeight: 18 },
  signInNote: { textAlign: "center", fontSize: 13, lineHeight: 18 },
});
