import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Button, ErrorState, Field, Loading, Screen, Title, styles as ui } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";

export default function MfaChallenge() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const destination = returnTo === "/account-deletion" ? "/account-deletion" : "/";
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let active = true;
    void (async () => {
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (assurance.data?.currentLevel === "aal2") { router.replace(destination); return; }
      const result = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (result.error) setError(userMessage(result.error, lang));
      else setFactorId(result.data?.totp?.find((f) => f.status === "verified")?.id ?? null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user?.id, destination, router, lang]);

  async function verify() {
    if (!factorId || !/^\d{6}$/.test(code) || busy) return;
    setBusy(true);
    setError(null);
    const challenged = await supabase.auth.mfa.challenge({ factorId });
    if (challenged.error || !challenged.data?.id) {
      setError(userMessage(challenged.error ?? new Error("MFA_REQUIRED"), lang));
      setBusy(false);
      return;
    }
    const verified = await supabase.auth.mfa.verify({ factorId, challengeId: challenged.data.id, code });
    setBusy(false);
    if (verified.error) {
      setError(lang === "ar" ? "الرمز غير صحيح أو انتهت صلاحيته. حاول برمز جديد." : "Invalid or expired code. Try a new code.");
      return;
    }
    router.replace(destination);
  }

  return <>
    <Stack.Screen options={{ title: lang === "ar" ? "التحقق بخطوتين" : "Two-step verification" }} />
    <Screen>
      <Title sub={lang === "ar" ? "اكتب الرمز الظاهر في تطبيق المصادقة لإكمال العملية." : "Enter the code from your authenticator app to continue."}>{lang === "ar" ? "أكّد هويتك" : "Verify your identity"}</Title>
      {!user ? <ErrorState message={lang === "ar" ? "سجّل الدخول أولاً." : "Sign in first."} />
        : loading ? <Loading rows={1} />
        : !factorId ? <Text style={ui.muted}>{lang === "ar" ? "لا توجد طريقة تحقق مفعّلة لهذا الحساب. تواصل مع الدعم إذا تعذّر الدخول." : "No verification method is available. Contact support if you cannot sign in."}</Text>
        : <View style={{ gap: 16 }}>
          <Field label={lang === "ar" ? "رمز التحقق" : "Verification code"} value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, "").slice(0, 6)); setError(null); }} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} />
          {error ? <ErrorState message={error} /> : null}
          <Button label={lang === "ar" ? "تأكيد الرمز" : "Confirm code"} loading={busy} disabled={code.length !== 6} onPress={() => void verify()} />
        </View>}
    </Screen>
  </>;
}