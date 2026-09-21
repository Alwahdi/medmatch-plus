import React from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LockKeyhole, MessageCircle } from "lucide-react-native";
import { Card, EmptyState, ErrorState, Loading, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useConversations, useUnreadMessages } from "@/lib/queries";
import { relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors, fonts, radii } from "@/lib/theme";

export default function MessagesTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const conversations = useConversations();
  const unread = useUnreadMessages();

  const unreadCount = new Map<string, number>();
  for (const message of unread.data ?? []) {
    unreadCount.set(message.conversation_id, (unreadCount.get(message.conversation_id) ?? 0) + 1);
  }

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={conversations.isFetching || unread.isFetching}
          onRefresh={() => {
            void conversations.refetch();
            void unread.refetch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <ScreenHeader title={t("messages")} sub={lang === "ar" ? "تواصل آمن داخل المنصة" : "Secure in-app conversations"} />
      {conversations.isPending ? (
        <Loading />
      ) : conversations.isError ? (
        <ErrorState message={userMessage(conversations.error, lang)} onRetry={() => void conversations.refetch()} />
      ) : (conversations.data ?? []).length === 0 ? (
        <EmptyState icon={MessageCircle} text={t("emptyMessages")} desc={t("emptyMessagesDesc")} />
      ) : (
        (conversations.data ?? []).map((c) => {
          const count = unreadCount.get(c.id) ?? 0;
          const title = c.subject || (lang === "ar" ? "محادثة" : "Conversation");
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={count ? `${title} — ${count} ${lang === "ar" ? "غير مقروءة" : "unread"}` : title}
              onPress={() => router.push({ pathname: "/conversation/[id]", params: { id: c.id } })}
            >
              <Card style={count ? { borderColor: colors.primary, padding: 14 } : { padding: 14 }}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <View style={{ width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={23} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text style={ui.bodyStrong} numberOfLines={1}>{title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {!c.identity_revealed ? <LockKeyhole size={13} color={colors.textSubtle} /> : null}
                      <Text style={ui.muted} numberOfLines={1}>
                        {!c.identity_revealed ? `${lang === "ar" ? "الهوية مخفية" : "Identity hidden"} · ` : ""}
                        {relativeTime(c.last_message_at, lang)}
                      </Text>
                    </View>
                  </View>
                  {count ? (
                    <View style={{ minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.primaryText }}>{count > 9 ? "9+" : count}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
