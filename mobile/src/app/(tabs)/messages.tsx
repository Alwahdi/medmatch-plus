import React from "react";
import { RefreshControl, Text } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Card, EmptyState, ErrorState, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useConversations } from "@/lib/queries";
import { relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { Pressable } from "react-native";

export default function MessagesTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const conversations = useConversations();

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={conversations.isFetching} onRefresh={() => void conversations.refetch()} />
      }
    >
      <Title>{t("messages")}</Title>
      {conversations.isPending ? (
        <Loading />
      ) : conversations.isError ? (
        <ErrorState message={userMessage(conversations.error, lang)} onRetry={() => void conversations.refetch()} />
      ) : (conversations.data ?? []).length === 0 ? (
        <EmptyState text={t("emptyMessages")} />
      ) : (
        (conversations.data ?? []).map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/conversation/[id]", params: { id: c.id } })}
          >
            <Card>
              <Row gap={8} wrap>
                <Text style={[ui.body, { fontWeight: "700", flexShrink: 1 }]}>
                  {c.subject || (lang === "ar" ? "محادثة" : "Conversation")}
                </Text>
                {!c.identity_revealed ? <Badge label={t("hiddenFacility")} /> : null}
              </Row>
              <Text style={ui.muted}>{relativeTime(c.last_message_at, lang)}</Text>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
