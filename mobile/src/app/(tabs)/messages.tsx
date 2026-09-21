import React from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { LockKeyhole, MessageCircle } from "lucide-react-native";
import { Badge, Card, EmptyState, ErrorState, Loading, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useConversations } from "@/lib/queries";
import { relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors, radii } from "@/lib/theme";

export default function MessagesTab() {
  const { t, lang } = useI18n(); const router = useRouter(); const conversations = useConversations();
  return <Screen refreshControl={<RefreshControl refreshing={conversations.isFetching} onRefresh={() => void conversations.refetch()} tintColor={colors.primary}/>}><Title sub={lang === "ar" ? "تواصل آمن داخل المنصة" : "Secure in-app conversations"}>{t("messages")}</Title>{conversations.isPending ? <Loading/> : conversations.isError ? <ErrorState message={userMessage(conversations.error, lang)} onRetry={() => void conversations.refetch()}/> : (conversations.data ?? []).length === 0 ? <EmptyState icon={MessageCircle} text={t("emptyMessages")} desc={t("emptyMessagesDesc")}/> : (conversations.data ?? []).map((c) => <Pressable key={c.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/conversation/[id]", params: { id: c.id } })}><Card><View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}><View style={{ width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}><MessageCircle size={23} color={colors.primary}/></View><View style={{ flex: 1, gap: 3 }}><Text style={ui.bodyStrong}>{c.subject || (lang === "ar" ? "محادثة" : "Conversation")}</Text><Text style={ui.muted}>{relativeTime(c.last_message_at, lang)}</Text></View>{!c.identity_revealed ? <LockKeyhole size={18} color={colors.textMuted}/> : <Badge label={t("verified")} tone="success"/>}</View></Card></Pressable>)}</Screen>;
}