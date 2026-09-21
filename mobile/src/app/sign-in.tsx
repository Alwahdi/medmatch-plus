import React, { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { LogIn } from "lucide-react-native";
import { Button, Card, ErrorState, Field, styles as ui } from "@/components/ui";
import { FormScreen } from "@/components/keyboard";
import { GoogleButton } from "@/components/google-button";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/oauth";
import { userMessage } from "@/lib/errors";
import { colors, fonts } from "@/lib/theme";

export default function SignIn() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) return setError(userMessage(err, lang));
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
    if (!email.trim()) return;
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    setNotice(t("resetSent"));
  };

  return (
    <FormScreen>
      <View style={{ alignItems: "center", marginTop: 30, marginBottom: 12 }}>
        <Brand />
        <Text style={{ fontFamily: fonts.regular, color: colors.textMuted, marginTop: 18 }}>
          {lang === "ar" ? "مرحباً بعودتك" : "Welcome back"}
        </Text>
        <Text style={[ui.title, { textAlign: "center" }]}>{t("signIn")}</Text>
      </View>

      <Card elevated style={{ gap: 14, padding: 20 }}>
        <GoogleButton label={t("continueWithGoogle")} onPress={google} loading={googleBusy} disabled={busy} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={ui.muted}>{t("orDivider")}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>
        <Field
          label={t("email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
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
        <Button label={t("signIn")} icon={LogIn} onPress={submit} loading={busy} disabled={!email || !password || googleBusy} />
        <Button label={t("forgotPassword")} variant="ghost" small onPress={reset} />
      </Card>

      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center", alignItems: "center" }}>
        <Text style={ui.muted}>{t("noAccount")}</Text>
        <Link href="/sign-up" style={{ color: colors.primary, fontFamily: fonts.bold }}>
          {t("signUp")}
        </Link>
      </View>
    </FormScreen>
  );
}
