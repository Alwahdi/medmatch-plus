import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from "@expo-google-fonts/cairo";
import { ActivityIndicator, View } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false, refetchOnReconnect: false },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}><ActivityIndicator color={colors.primary} /></View>;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <AuthProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.surface },
                  headerTintColor: colors.text,
                  headerTitleStyle: { fontFamily: "Cairo_700Bold" },
                  headerBackTitle: "",
                  headerBackButtonDisplayMode: "minimal",
                  headerTitleAlign: "center",
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: colors.bg },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                <Stack.Screen name="sign-up" options={{ headerShown: false }} />
              </Stack>
            </AuthProvider>
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
