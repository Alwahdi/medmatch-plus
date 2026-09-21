import React from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Badge, Card, EmptyState, ErrorState, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useMarkNotificationRead, useNotifications } from "@/lib/queries";
import { relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { Bell, BellDot } from "lucide-react-native";
import { colors, radii } from "@/lib/theme";

export default function NotificationsScreen() {
  const { t, lang } = useI18n();
  const list = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <>
      <Stack.Screen options={{ title: t("notifications") }} />
      <Screen refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={() => void list.refetch()} tintColor={colors.primary} />}>
        <Title sub={lang === "ar" ? "آخر تحديثات حسابك ونشاطك" : "Latest account and activity updates"}>{t("notifications")}</Title>
        {unreadCount ? (
          <Button
            label={t("markAllRead")}
            variant="secondary"
            small
            onPress={() => {
              for (const n of list.data ?? []) if (!n.read_at) markRead.mutate(n.id);
            }}
          />
        ) : null}
        {list.isPending ? (
          <Loading />
        ) : list.isError ? (
          <ErrorState message={userMessage(list.error, lang)} onRetry={() => void list.refetch()} />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState icon={Bell} text={t("emptyNotifications")} desc={t("emptyNotificationsDesc")} />
        ) : (
          (list.data ?? []).map((n) => (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              onPress={() => {
                if (!n.read_at) markRead.mutate(n.id);
              }}
            >
               <Card style={!n.read_at ? { borderColor: colors.primary } : undefined}>
                 <Row gap={10}><View style={{ width: 42, height: 42, borderRadius: radii.md, backgroundColor: !n.read_at ? colors.primarySoft : colors.surfaceMuted, alignItems: "center", justifyContent: "center" }}>{!n.read_at ? <BellDot size={21} color={colors.primary}/> : <Bell size={20} color={colors.textMuted}/>}</View><View style={{ flex: 1 }}>
                <Row gap={8} wrap>
                   <Text style={[ui.bodyStrong, { flexShrink: 1 }]}> 
                    {(lang === "ar" ? n.title_ar : n.title_en) || n.title_ar}
                  </Text>
                  {!n.read_at ? <Badge label={lang === "ar" ? "جديد" : "New"} tone="primary" /> : null}
                </Row>
                <Text style={ui.muted}>{(lang === "ar" ? n.body_ar : n.body_en) ?? ""}</Text>
                <Text style={ui.muted}>{relativeTime(n.created_at, lang)}</Text>
                 </View></Row>
              </Card>
            </Pressable>
          ))
        )}
      </Screen>
    </>
  );
}
