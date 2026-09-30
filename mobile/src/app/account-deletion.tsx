import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Button, ErrorState, Field, Loading, Screen, Title, styles as ui } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";

export default function AccountDeletion() {
  const { lang } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useQuery({
    queryKey: ["account-deletion-request", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error: queryError } = await supabase.rpc("my_account_deletion_request");
      if (queryError) throw queryError;
      return data?.[0] ?? null;
    },
    refetchOnMount: "always",
  });
  const active = request.data && ["pending", "processing"].includes(request.data.status) ? request.data : null;

  async function send() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: submitError } = await supabase.rpc("request_account_deletion", reason.trim() ? { _reason: reason.trim() } : {});
    setBusy(false);
    if (submitError) return setError(userMessage(submitError, lang));
    setReason("");
    void request.refetch();
  }

  async function cancel(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: cancelError } = await supabase.rpc("cancel_account_deletion", { _request_id: id });
    setBusy(false);
    if (cancelError) return setError(userMessage(cancelError, lang));
    void request.refetch();
  }

  const confirmSend = () => Alert.alert(
    lang === "ar" ? "إرسال طلب حذف الحساب؟" : "Request account deletion?",
    lang === "ar" ? "سيراجع الفريق الطلب. يمكنك إلغاؤه قبل بدء المعالجة." : "Our team will review your request. You may cancel it before processing starts.",
    [
      { text: lang === "ar" ? "رجوع" : "Back", style: "cancel" },
      { text: lang === "ar" ? "إرسال الطلب" : "Send request", style: "destructive", onPress: () => void send() },
    ],
  );

  return <>
    <Stack.Screen options={{ title: lang === "ar" ? "حذف الحساب" : "Delete account" }} />
    <Screen>
      <Title>{lang === "ar" ? "حذف الحساب" : "Delete account"}</Title>
      <Text style={ui.muted}>{lang === "ar"
        ? "يُرسل طلب الحذف للمراجعة؛ لا يُحذف الحساب فورًا. قد نحتفظ بسجلات التعاملات المطلوبة بعد إخفاء الهوية. يمكنك متابعة حالة طلبك هنا."
        : "Deletion requests are reviewed; your account is not erased immediately. Necessary transaction records may be retained after anonymisation. You can track your request here."}</Text>
      {!user ? <ErrorState message={lang === "ar" ? "سجّل الدخول أولًا." : "Sign in first."} />
        : request.isPending ? <Loading rows={1} />
        : request.isError ? <View style={{ gap: 12 }}>
          <ErrorState message={userMessage(request.error, lang)} onRetry={() => void request.refetch()} />
          {userMessage(request.error, lang) === userMessage(new Error("MFA_REQUIRED"), lang) ? <Button label={lang === "ar" ? "أكّد هويتك للمتابعة" : "Verify your identity"} variant="secondary" onPress={() => router.push({ pathname: "/mfa-challenge", params: { returnTo: "/account-deletion" } })} /> : null}
        </View>
        : active ? <View style={{ gap: 16 }}>
          <Text style={ui.bodyStrong}>{active.status === "pending"
            ? (lang === "ar" ? "طلبك قيد الانتظار" : "Your request is pending")
            : (lang === "ar" ? "طلبك قيد المعالجة" : "Your request is being processed")}</Text>
          <Text style={ui.muted}>{active.status === "pending"
            ? (lang === "ar" ? "يمكنك إلغاء الطلب قبل بدء المعالجة." : "You can cancel before processing starts.")
            : (lang === "ar" ? "لا يمكن إلغاء الطلب من هنا بعد بدء المعالجة. تواصل معنا إذا غيّرت رأيك." : "You can't cancel here once processing begins. Contact support if you've changed your mind.")}</Text>
          {active.status === "pending" ? <Button label={lang === "ar" ? "إلغاء الطلب" : "Cancel request"} variant="secondary" loading={busy} onPress={() => void cancel(active.id)} /> : null}
        </View> : <View style={{ gap: 16 }}>
          <Field label={lang === "ar" ? "سبب الحذف (اختياري)" : "Reason (optional)"} value={reason} onChangeText={setReason} multiline maxLength={1000} showCount />
          <Button label={lang === "ar" ? "إرسال طلب الحذف" : "Submit deletion request"} variant="danger" loading={busy} onPress={confirmSend} />
        </View>}
      {error ? <ErrorState message={error} /> : null}
    </Screen>
  </>;
}