import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Text, View, type ColorValue } from "react-native";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 18, color }}>{glyph}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return null;
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 62, paddingBottom: 8 },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("jobs"), tabBarIcon: ({ color }) => <TabIcon glyph="🩺" color={color} /> }}
      />
      <Tabs.Screen
        name="shifts"
        options={{ title: t("shifts"), tabBarIcon: ({ color }) => <TabIcon glyph="🕒" color={color} /> }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: t("activity"), tabBarIcon: ({ color }) => <TabIcon glyph="📋" color={color} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: t("messages"), tabBarIcon: ({ color }) => <TabIcon glyph="💬" color={color} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t("account"), tabBarIcon: ({ color }) => <TabIcon glyph="👤" color={color} /> }}
      />
    </Tabs>
  );
}
