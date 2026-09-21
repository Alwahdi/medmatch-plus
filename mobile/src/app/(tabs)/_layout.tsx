import React from "react";
import { Redirect, Tabs } from "expo-router";
import { View, type ColorValue } from "react-native";
import { BriefcaseBusiness, CalendarClock, ClipboardList, MessageCircle, UserRound, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";
import { Loading } from "@/components/ui";

function TabIcon({ icon: Icon, color, focused }: { icon: LucideIcon; color: ColorValue; focused: boolean }) {
  return (
    <View style={{ width: 38, height: 32, borderRadius: 12, backgroundColor: focused ? colors.primarySoft : "transparent", alignItems: "center", justifyContent: "center" }}>
      <Icon size={21} color={String(color)} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 76, paddingTop: 8, paddingBottom: 10 },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarHideOnKeyboard: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("jobs"), tabBarIcon: ({ color, focused }) => <TabIcon icon={BriefcaseBusiness} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="shifts"
        options={{ title: t("shifts"), tabBarIcon: ({ color, focused }) => <TabIcon icon={CalendarClock} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="activity"
        options={{ title: t("activity"), tabBarIcon: ({ color, focused }) => <TabIcon icon={ClipboardList} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: t("messages"), tabBarIcon: ({ color, focused }) => <TabIcon icon={MessageCircle} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t("account"), tabBarIcon: ({ color, focused }) => <TabIcon icon={UserRound} color={color} focused={focused} /> }}
      />
    </Tabs>
  );
}
