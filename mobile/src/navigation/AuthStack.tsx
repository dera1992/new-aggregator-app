import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { LoginScreen } from "@/screens/LoginScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { ConfirmEmailScreen } from "@/screens/ConfirmEmailScreen";
import { ForgotPasswordScreen } from "@/screens/ForgotPasswordScreen";
import { ResetPasswordScreen } from "@/screens/ResetPasswordScreen";
import { PricingScreen } from "@/screens/PricingScreen";

export type AuthStackParamList = {
  Login: { message?: string } | undefined;
  Register: undefined;
  ConfirmEmail: { email?: string; message?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Pricing: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ConfirmEmail" component={ConfirmEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
    </Stack.Navigator>
  );
}
