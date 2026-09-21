import React, { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { EmptyState, ErrorState, Loading, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useMessages, useSendMessage } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors, radii } from "@/lib/theme";
import { Send } from "lucide-react-native";

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const messages = useMessages(String(id));
  const send = useSendMessage(String(id));
  const [body, setBody] = useState("");

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    send.mutate(text);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: t("messages") }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {messages.isPending ? (
          <Loading />
        ) : messages.isError ? (
          <View style={{ padding: 16 }}>
            <ErrorState message={userMessage(messages.error, lang)} onRetry={() => void messages.refetch()} />
          </View>
        ) : (
          <FlatList
            data={messages.data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            ListEmptyComponent={<EmptyState text={t("emptyMessages")} />}
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              return (
                <View
                  style={{
                    alignSelf: mine ? "flex-end" : "flex-start",
                    maxWidth: "82%",
                    backgroundColor: mine ? colors.primary : colors.surface,
                    borderColor: mine ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: radii.lg,
                    padding: 10,
                    gap: 4,
                  }}
                >
                   <Text style={[ui.body, { color: mine ? colors.primaryText : colors.text }]}>{item.body}</Text>
                   <Text style={[ui.muted, { color: mine ? colors.messageOnPrimary : colors.textMuted, fontSize: 11 }]}>
                    {relativeTime(item.created_at, lang)}
                  </Text>
                </View>
              );
            }}
          />
        )}

        <View
          style={{
            flexDirection: "row",
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
            style={[ui.input, { flex: 1 }]}
            multiline
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("send")}
            onPress={submit}
            style={{
              minWidth: 56,
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radii.md,
              backgroundColor: colors.primary,
              opacity: body.trim() && !send.isPending ? 1 : 0.5,
            }}
          >
             <Send size={22} color={colors.primaryText}/>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
