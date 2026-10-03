import React from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Building2, LockKeyhole, MessageCircle, UserRound } from "lucide-react-native";
import { Badge, Card, EmptyState, ErrorState, Loading, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { conversationParty, useConversations, useUnreadMessages } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { useAvatarUrl } from "@/lib/avatar";
import { relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors, fonts, radii, space } from "@/lib/theme";

function PartyAvatar({ image, kind }: { image: string | null; kind: "facility" | "pro" }) {
  const url = useAvatarUrl(image);
  const Icon = kind === "facility" ? Building2 : UserRound;
  return (
    <View style={{ width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {url ? <Image source={{ uri: url }} style={{ width: 48, height: 48 }} contentFit="cover" transition={150} /> : <Icon size={23} color={colors.primary} />}
    </View>
  );
}

export default function MessagesTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const conversations = useConversations();
  const unread = useUnreadMessages();

  const unreadCount = new Map<string, number>();
  for (const message of unread.data ?? []) {
    unreadCount.set(message.conversation_id, (unreadCount.get(message.conversation_id) ?? 0) + 1);
  }

  const data = conversations.data;
  const list = data?.list ?? [];

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
      ) : list.length === 0 ? (
        <EmptyState icon={MessageCircle} text={t("emptyMessages")} desc={t("emptyMessagesDesc")} />
      ) : (
        list.map((c) => {
          const count = unreadCount.get(c.id) ?? 0;
          const party = conversationParty(c, data!, user?.id, lang);
          const topic = c.job_id ? data!.jobs[c.job_id]?.title : c.shift_id ? data!.shifts[c.shift_id]?.title : c.subject;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={count ? `${party.name} — ${count} ${lang === "ar" ? "غير مقروءة" : "unread"}` : party.name}
              onPress={() => router.push({ pathname: "/conversation/[id]", params: { id: c.id } })}
            >
               <Card style={count ? { borderColor: colors.primary } : undefined}>
                 <View style={{ flexDirection: "row", gap: space.lg, alignItems: "center" }}>
                  <PartyAvatar image={party.image} kind={party.kind} />
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={ui.bodyStrong} numberOfLines={1}>{party.name}</Text>
                      {party.verified ? <Badge label={t("verified")} tone="success" /> : null}
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      {party.hidden ? <LockKeyhole size={13} color={colors.textSubtle} /> : null}
                      <Text style={ui.muted} numberOfLines={1}>
                        {topic ? `${topic} · ` : ""}
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
