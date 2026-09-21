import React from "react";
import { Redirect, Tabs } from "expo-router";
import { View, type ColorValue } from "react-native";
import { BriefcaseBusiness, Compass, Home, ClipboardList, MessageCircle, UserRound, UsersRound, type LucideIcon } from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/theme";
import { Loading } from "@/components/ui";
import { useMyInvitations, usePendingReviews, useUnreadMessages } from "@/lib/queries";

function TabIcon({ icon: Icon, color, focused }: { icon: LucideIcon; color: ColorValue; focused: boolean }) {
  return (
    <View style={{ width: 38, height: 32, borderRadius: 12, backgroundColor: focused ? colors.primarySoft : "transparent", alignItems: "center", justifyContent: "center" }}>
      <Icon size={21} color={String(color)} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const { session, user, roles, loading, isFacility } = useAuth();
  const { t } = useI18n();
  const invitations = useMyInvitations();
  const reviews = usePendingReviews();
  const unreadMessages = useUnreadMessages();

  const activityCount =
    (invitations.data ?? []).filter((i) => i.status === "pending").length +
    ((reviews.data as unknown[] | undefined) ?? []).length;

  if (loading) return <Loading />;
  if (!session) return <Redirect href="/sign-in" />;
  if (roles.length === 0) {
    const intendedRole = user?.user_metadata?.intended_role;
    return <Redirect href={intendedRole === "facility" ? "/facility/profile" : "/profile"} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 76, paddingTop: 8, paddingBottom: 10 },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: colors.danger, fontFamily: fonts.bold, fontSize: 10 },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("home"), tabBarIcon: ({ color, focused }) => <TabIcon icon={Home} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: isFacility ? t("myListings") : t("discover"), tabBarIcon: ({ color, focused }) => <TabIcon icon={isFacility ? BriefcaseBusiness : Compass} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: isFacility ? t("applicants") : t("activity"),
          tabBarBadge: !isFacility && activityCount ? activityCount : undefined,
          tabBarIcon: ({ color, focused }) => <TabIcon icon={isFacility ? UsersRound : ClipboardList} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: t("messages"), tabBarBadge: unreadMessages.data?.length || undefined, tabBarIcon: ({ color, focused }) => <TabIcon icon={MessageCircle} color={color} focused={focused} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t("account"), tabBarIcon: ({ color, focused }) => <TabIcon icon={UserRound} color={color} focused={focused} /> }}
      />
    </Tabs>
  );
}
