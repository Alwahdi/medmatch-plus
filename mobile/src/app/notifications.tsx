import React from "react";
import { Pressable, RefreshControl, Text } from "react-native";
import { Stack } from "expo-router";
import { Badge, Card, EmptyState, ErrorState, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useMarkNotificationRead, useNotifications } from "@/lib/queries";
import { relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";

export default function NotificationsScreen() {
  const { t, lang } = useI18n();
  const list = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <>
      <Stack.Screen options={{ title: t("notifications") }} />
      <Screen refreshControl={<RefreshControl refreshing={list.isFetching} onRefresh={() => void list.refetch()} />}>
        <Title>{t("notifications")}</Title>
        {list.isPending ? (
          <Loading />
        ) : list.isError ? (
          <ErrorState message={userMessage(list.error, lang)} onRetry={() => void list.refetch()} />
        ) : (list.data ?? []).length === 0 ? (
          <EmptyState text={t("emptyNotifications")} />
        ) : (
          (list.data ?? []).map((n) => (
            <Pressable
              key={n.id}
              accessibilityRole="button"
              onPress={() => {
                if (!n.read_at) markRead.mutate(n.id);
              }}
            >
              <Card>
                <Row gap={8} wrap>
                  <Text style={[ui.body, { fontWeight: "700", flexShrink: 1 }]}>
                    {(lang === "ar" ? n.title_ar : n.title_en) || n.title_ar}
                  </Text>
                  {!n.read_at ? <Badge label={lang === "ar" ? "جديد" : "New"} tone="primary" /> : null}
                </Row>
                <Text style={ui.muted}>{(lang === "ar" ? n.body_ar : n.body_en) ?? ""}</Text>
                <Text style={ui.muted}>{relativeTime(n.created_at, lang)}</Text>
              </Card>
            </Pressable>
          ))
        )}
      </Screen>
    </>
  );
}
