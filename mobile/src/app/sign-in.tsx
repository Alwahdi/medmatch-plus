import React, { useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, LogIn, Mail, MailCheck } from "lucide-react-native";
import { Button, ErrorState, Field, styles as ui } from "@/components/ui";
import { AuthScaffold } from "@/components/auth-scaffold";
import { GoogleButton } from "@/components/google-button";
import { useI18n } from "@/lib/i18n";
import { supabase, WEB_URL } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/oauth";
import { userMessage } from "@/lib/errors";
import { colors, fonts, radii } from "@/lib/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignIn() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [step, setStep] = useState<"email" | "password" | "sent">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const goToPassword = () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError(t("emailInvalid"));
    setError(null);
    setNotice(null);
    setStep("password");
    setTimeout(() => passwordRef.current?.focus(), 120);
  };

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setError(userMessage(err, lang));
    }
    router.replace("/(tabs)");
  };

  const google = async () => {
    setGoogleBusy(true);
    setError(null);
    setNotice(null);
    const result = await signInWithGoogle();
    setGoogleBusy(false);
    if (result.ok) return router.replace("/(tabs)");
    if (result.cancelled) return setNotice(t("googleCancelled"));
    setError(result.error ? userMessage(result.error, lang) : t("googleFailed"));
  };

  const reset = async () => {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) return setError(t("emailInvalid"));
    setBusy(true);
    setError(null);
    await supabase.auth.resetPasswordForEmail(value, {
      redirectTo: `${WEB_URL.replace(/\/$/, "")}/reset-password`,
    });
    setBusy(false);
    setStep("sent");
  };

  const backToEmail = () => {
    setStep("email");
    setPassword("");
    setError(null);
  };

  return (
    <AuthScaffold
      title={step === "email" ? t("emailStepTitle") : step === "password" ? t("passwordStepTitle") : t("resetSentTitle")}
      sub={step === "email" ? (lang === "ar" ? "مرحباً بعودتك." : "Welcome back.") : undefined}
      onBack={step === "password" ? backToEmail : undefined}
    >
      {step === "email" ? (
        <View style={{ gap: 14 }}>
          <GoogleButton label={t("continueWithGoogle")} onPress={google} loading={googleBusy} disabled={busy} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={ui.muted}>{t("orDivider")}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>
          <Field
            label={t("email")}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={goToPassword}
          />
          {error ? <ErrorState message={error} /> : null}
          {notice ? <Text style={ui.muted}>{notice}</Text> : null}
          <Button label={t("continueLabel")} icon={Mail} onPress={goToPassword} disabled={!email.trim() || googleBusy} />
        </View>
      ) : null}

      {step === "password" ? (
        <View style={{ gap: 14 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("changeEmail")}
            onPress={backToEmail}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              minHeight: 48,
              paddingHorizontal: 12,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surfaceMuted,
            }}
          >
            <ArrowLeft size={18} color={colors.textMuted} />
            <Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>
              {email.trim()}
            </Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.primary }}>{t("changeEmail")}</Text>
          </Pressable>
          <Field
            ref={passwordRef}
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />
          {error ? <ErrorState message={error} /> : null}
          {notice ? <Text style={ui.muted}>{notice}</Text> : null}
          <Button label={t("signIn")} icon={LogIn} onPress={submit} loading={busy} disabled={!password} />
          <Button label={t("forgotPassword")} variant="ghost" small onPress={reset} />
        </View>
      ) : null}

      {step === "sent" ? (
        <View style={{ gap: 14, alignItems: "center", paddingVertical: 12 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
            <MailCheck size={34} color={colors.success} strokeWidth={2.2} />
          </View>
          <Text style={[ui.muted, { textAlign: "center" }]}>{t("resetSent")}</Text>
          <View style={{ alignSelf: "stretch" }}>
            <Button label={t("back")} variant="secondary" onPress={backToEmail} />
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", alignItems: "center" }}>
        <Text style={ui.muted}>{t("noAccount")}</Text>
        <Link href="/sign-up" style={{ color: colors.primary, fontFamily: fonts.bold }}>
          {t("signUp")}
        </Link>
      </View>
    </AuthScaffold>
  );
}
