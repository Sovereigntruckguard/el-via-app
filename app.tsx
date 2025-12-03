import { DarkTheme, NavigationContainer, Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { Platform } from "react-native";
import 'react-native-gesture-handler';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ROSEN } from "./src/theme/rosen";

import GlossaryScreen from "./src/screens/GlossaryScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ManualScreen from "./src/screens/ManualScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import SignInScreen from "./src/screens/SignInScreen";
import TrainingScreen from "./src/screens/TrainingScreen";

const Stack = createNativeStackNavigator();

const AppTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: ROSEN.colors.black,
    card: ROSEN.colors.card,
    text: ROSEN.colors.white,
    border: ROSEN.colors.border,
    primary: ROSEN.colors.rose,
    notification: ROSEN.colors.rose
  }
};

function RootNavigator() {
  const { isAuthenticated, isPaid } = useAuth();
  const initial = isAuthenticated ? "Home" : (isPaid ? "SignIn" : "Onboarding");

  return (
    <Stack.Navigator
      initialRouteName={initial}
      screenOptions={{
        headerStyle: { backgroundColor: ROSEN.colors.card },
        headerTintColor: ROSEN.colors.white,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: ROSEN.colors.black },
        animation: Platform.select({ ios: "slide_from_right", android: "fade_from_bottom" })
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "ELVIA • DOT Express" }} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "ELVIA • DOT Express" }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: "ELVIA • DOT Express" }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "ELVIA • DOT Express" }} />
      <Stack.Screen name="Manual" component={ManualScreen} options={{ title: "Manual Bilingüe" }} />
      <Stack.Screen name="Glossary" component={GlossaryScreen} options={{ title: "Señales + Quiz" }} />
      <Stack.Screen name="Training" component={TrainingScreen} options={{ title: "Capacitación" }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={AppTheme}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
