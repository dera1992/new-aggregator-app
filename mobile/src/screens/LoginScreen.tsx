import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useRoute } from "@react-navigation/native";


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
import { StyleSheet, Text, View, Platform } from "react-native";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;
type LoginRouteProp = RouteProp<AuthStackParamList, "Login">;

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export function LoginScreen() {
  const { signIn, token } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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

  const validationError = useMemo(
    () => errors.email?.message ?? errors.password?.message ?? "",
    [errors.email?.message, errors.password?.message],
  );

  useEffect(() => {
    if (token && isLoggingIn) {
      console.log('✅ Token set, navigation should happen automatically');
      console.log('✅ Token:', token.substring(0, 20) + '...');
    }
  }, [token, isLoggingIn]);

  const onSubmit = async (values: FormValues) => {
  setError("");
  setIsLoggingIn(true);

  console.log('🧪 DIAGNOSTIC MODE - Testing network step by step');
  console.log('🧪 Step 0: onSubmit function called');
  console.log('🧪 Platform:', Platform.OS);

  // Skip Google test on web (CORS blocks it)
  if (Platform.OS !== 'web') {
    console.log('🧪 Step 1: Testing internet (Google)...');
    try {
      const start1 = Date.now();
      const googleResponse = await Promise.race([
        fetch('https://www.google.com', { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
      ]);
      const duration1 = Date.now() - start1;
      console.log(`✅ Step 1 PASSED: Google reachable in ${duration1}ms`);
    } catch (err) {
      console.error('❌ Step 1 FAILED:', (err as Error).message);
      setError('No internet connection');
      setIsLoggingIn(false);
      return;
    }
  } else {
    console.log('⏭️ Step 1 SKIPPED: Web platform (CORS blocks Google test)');
  }

  // TEST 2: Can we reach your server?
  console.log('🧪 Step 2: Testing server (GET /)...');
  try {
    const start2 = Date.now();
    const serverResponse = await Promise.race([
      fetch(`${apiUrl}/`, { method: 'GET' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
    const duration2 = Date.now() - start2;
    console.log(`✅ Step 2 PASSED: Server reachable in ${duration2}ms, status: ${(serverResponse as Response).status}`);
  } catch (err) {
    console.error('❌ Step 2 FAILED:', (err as Error).message);
    setError('Cannot reach server');
    setIsLoggingIn(false);
    return;
  }

  // TEST 3: Can we POST to login endpoint?
  console.log('🧪 Step 3: Testing login POST...');
  const requestPayload = {
    email: values.email.trim(),
    password: values.password,
  };

  try {
    const start3 = Date.now();
    console.log('🧪 Sending login request...');
    const data = await login(requestPayload);
    const duration3 = Date.now() - start3;
    console.log(`✅ Step 3 PASSED: Login succeeded in ${duration3}ms`);
    console.log('✅ Token received:', data.token?.substring(0, 20) + '...');

    console.log('🧪 Step 4: Calling signIn...');
    signIn(data.token);
    console.log('✅ Step 4 PASSED: signIn called');

  } catch (err) {
    console.error('❌ Step 3 FAILED:', (err as Error).message);
    setIsLoggingIn(false);
    setError((err as Error).message || "Login failed");
  }
};

  const onInvalid = (formErrors: FieldErrors<FormValues>) => {
    void formErrors;
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
      {isLoggingIn && !error ? (
        <Text style={[styles.successText, { color: theme.colors.primary }]}>
          Login successful! Redirecting...
        </Text>
      ) : null}
      <Button
        label={isSubmitting ? "Signing in..." : "Login"}
        disabled={isSubmitting}
        onPress={() => handleSubmit(onSubmit, onInvalid)()}
      />
      <Button
      label="Test Network"
      variant="outline"
      onPress={async () => {
        console.log('🧪 Testing basic network...');

        // Test 1: Can we reach the server at all?
        try {
          const response = await fetch('http://192.168.0.147:8080');
          console.log('✅ Server reachable:', response.status);
        } catch (err) {
          console.error('❌ Server NOT reachable:', err);
        }

        // Test 2: Can we reach google?
        try {
          const response = await fetch('https://www.google.com');
          console.log('✅ Internet works:', response.status);
        } catch (err) {
          console.error('❌ Internet NOT working:', err);
        }

        // Test 3: XHR to server
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'http://192.168.0.147:8080', true);
        xhr.onload = () => console.log('✅ XHR to server works');
        xhr.onerror = () => console.error('❌ XHR to server failed');
        xhr.send();
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
  successText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: '600',
  },
});