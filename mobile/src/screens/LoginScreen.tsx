import React, { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { Input } from "@/components/Input";
import { login } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { getTheme } from "@/lib/theme/tokens";
import type { AuthStackParamList } from "@/navigation/AuthStack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import type { FieldErrors } from "react-hook-form";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type LoginRouteProp = RouteProp<AuthStackParamList, "Login">;

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const [error, setError] = useState("");
  const [debugTrace, setDebugTrace] = useState<string[]>([]);
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });


  const addDebugTrace = useCallback((event: string, payload?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString().split("T")[1]?.replace("Z", "") ?? "time";
    const detail = payload ? ` ${JSON.stringify(payload)}` : "";
    const line = `[${timestamp}] ${event}${detail}`;

    // eslint-disable-next-line no-console
    console.log(line);

    setDebugTrace((current) => [line, ...current].slice(0, 6));
  }, []);

  const validationError = useMemo(
    () => errors.email?.message ?? errors.password?.message ?? "",
    [errors.email?.message, errors.password?.message],
  );

  const onSubmit = async (values: FormValues) => {
    addDebugTrace("[auth][login] onSubmit triggered", {
      email: values.email,
      passwordLength: values.password.length,
      apiUrl,
    });

    setError("");

    const requestPayload = {
      email: values.email.trim(),
      password: values.password,
    };

    try {
      addDebugTrace("[auth][login] calling login API", {
        email: requestPayload.email,
      });
      const data = await login(requestPayload);
      addDebugTrace("[auth][login] login API success", {
        hasToken: Boolean(data?.token),
      });
      await signIn(data.token);
    } catch (err) {
      addDebugTrace("[auth][login] login API failed", {
        message: (err as Error)?.message,
      });
      setError(
        (err as Error).message ||
          "Login failed. Please check your credentials and try again.",
      );
    }
  };

  const onInvalid = (formErrors: FieldErrors<FormValues>) => {
    addDebugTrace("[auth][login] submit blocked by validation errors", {
      formErrors,
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to access your personalized news feed."
    >
      <View style={styles.formGroup}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={watch("email")}
          onChangeText={(value) =>
            setValue("email", value, {
              shouldDirty: true,
              shouldValidate: false,
            })
          }
          editable={!isSubmitting}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          value={watch("password")}
          onChangeText={(value) =>
            setValue("password", value, {
              shouldDirty: true,
              shouldValidate: false,
            })
          }
          editable={!isSubmitting}
        />
      </View>
      {route.params?.message ? (
        <Text style={[styles.infoText, { color: theme.colors.primary }]}>
          {route.params.message}
        </Text>
      ) : null}
      {validationError ? <ErrorState message={validationError} /> : null}
      {error ? <ErrorState message={error} /> : null}
      <Button
        label={isSubmitting ? "Signing in..." : "Login"}
        disabled={isSubmitting}
        onPress={() => {
          addDebugTrace("[auth][login] login button pressed");
          return handleSubmit(onSubmit, onInvalid)();
        }}
      />
      {isSubmitting ? (
        <Text
          style={[styles.submittingHint, { color: theme.colors.textMuted }]}
        >
          {" "}
          {`Submitting to ${apiUrl ?? "EXPO_PUBLIC_API_URL not set"} ...`}
        </Text>
      ) : null}
      {__DEV__ ? (
        <View style={styles.debugPanel}>
          <Text style={[styles.debugTitle, { color: theme.colors.textMuted }]}>
            Login debug trace
          </Text>
          {debugTrace.length === 0 ? (
            <Text style={[styles.debugLine, { color: theme.colors.textMuted }]}>
              No login events yet. Tap Login to generate trace.
            </Text>
          ) : (
            debugTrace.map((line) => (
              <Text key={line} style={[styles.debugLine, { color: theme.colors.textMuted }]}>
                {line}
              </Text>
            ))
          )}
        </View>
      ) : null}
      <View style={styles.secondaryActions}>
        <Button
          label="Create account"
          variant="secondary"
          disabled={isSubmitting}
          onPress={() => navigation.navigate("Register")}
        />
        <Button
          label="View pricing"
          variant="outline"
          disabled={isSubmitting}
          onPress={() => navigation.navigate("Pricing")}
        />
        <Button
          label="Forgot password"
          variant="ghost"
          disabled={isSubmitting}
          onPress={() => navigation.navigate("ForgotPassword")}
        />
      </View>
      <Text style={[styles.legalText, { color: theme.colors.textMuted }]}>
        By continuing you agree to the News Aggregator terms.
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    gap: 12,
  },
  secondaryActions: {
    gap: 10,
  },
  debugPanel: {
    marginTop: 8,
    gap: 4,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  debugLine: {
    fontSize: 11,
    lineHeight: 14,
  },
  legalText: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
  },
  submittingHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
