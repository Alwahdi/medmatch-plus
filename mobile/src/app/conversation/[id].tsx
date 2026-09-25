import React, { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { EmptyState, ErrorState, Loading, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useMarkConversationRead, useMessages, useSendMessage } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { dayKey, formatDayLabel, formatTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors, radii } from "@/lib/theme";
import { Send } from "lucide-react-native";

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const messages = useMessages(String(id));
  const send = useSendMessage(String(id));
  const markRead = useMarkConversationRead(String(id));
  const [body, setBody] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (id) markRead.mutate();
  }, [id]);

  const submit = () => {
    const text = body.trim();
    if (!text || send.isPending) return;
    setSendError(null);
    send.mutate(text, { onSuccess: () => setBody((current) => current.trim() === text ? "" : current), onError: (cause) => setSendError(userMessage(cause, lang)) });
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: t("messages") }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 44 : 0}
      >
        {messages.isPending ? (
          <Loading />
        ) : messages.isError ? (
          <View style={{ padding: 16 }}>
            <ErrorState message={userMessage(messages.error, lang)} onRetry={() => void messages.refetch()} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages.data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            onRefresh={() => { void messages.refetch(); markRead.mutate(); }}
            refreshing={messages.isFetching}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={<EmptyState text={t("emptyMessages")} />}
            renderItem={({ item, index }) => {
              const mine = item.sender_id === user?.id;
              const list = messages.data ?? [];
              const previous = index > 0 ? list[index - 1] : null;
              const showDay = !previous || dayKey(previous.created_at) !== dayKey(item.created_at);
              return (
                <View style={{ gap: 10 }}>
                  {showDay ? (
                    <Text style={[ui.muted, { textAlign: "center", fontSize: 12 }]}>{formatDayLabel(item.created_at, lang)}</Text>
                  ) : null}
                  <View
                    style={{
                      alignSelf: mine ? "flex-end" : "flex-start",
                      maxWidth: "82%",
                      backgroundColor: mine ? colors.primary : colors.surface,
                      borderColor: mine ? colors.primary : colors.border,
                      borderWidth: 1,
                      borderRadius: radii.lg,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      gap: 2,
                    }}
                  >
                    <Text style={[ui.body, { color: mine ? colors.primaryText : colors.text }]}>{item.body}</Text>
                    <Text
                      style={[ui.muted, { color: mine ? colors.messageOnPrimary : colors.textSubtle, fontSize: 11, textAlign: "right" }]}
                    >
                      {formatTime(item.created_at, lang)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {sendError ? <Text accessibilityRole="alert" style={[ui.error, { paddingHorizontal: 16 }]}>{sendError}</Text> : null}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: 8,
            padding: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t("typeMessage")}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t("typeMessage")}
            style={[ui.input, { flex: 1, maxHeight: 130, paddingTop: 14 }]}
            multiline
            onFocus={() => requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("send")}
            accessibilityState={{ disabled: !body.trim() || send.isPending, busy: send.isPending }}
            onPress={submit}
            style={{
              minWidth: 56,
              minHeight: 52,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.md,
              backgroundColor: colors.primary,
              opacity: body.trim() && !send.isPending ? 1 : 0.5,
            }}
          >
            <Send size={22} color={colors.primaryText} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
