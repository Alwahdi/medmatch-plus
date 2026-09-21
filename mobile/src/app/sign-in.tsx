import React, { useState } from "react";
import { Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Button, Card, ErrorState, Field, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";

export default function SignIn() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      return;
    }
    router.replace("/(tabs)");
  };

  const reset = async () => {
    if (!email.trim()) return;
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    setNotice(t("resetSent"));
  };

  return (
    <Screen>
      <View style={{ gap: 4, marginTop: 24 }}>
        <Title sub={t("tagline")}>{t("appName")}</Title>
      </View>
      <Card style={{ gap: 12 }}>
        <Field
          label={t("email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label={t("password")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
        />
        {error ? <ErrorState message={error} /> : null}
        {notice ? <Text style={ui.muted}>{notice}</Text> : null}
        <Button label={t("signIn")} onPress={submit} loading={busy} disabled={!email || !password} />
        <Button label={t("forgotPassword")} variant="ghost" small onPress={reset} />
      </Card>
      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
        <Text style={ui.muted}>{t("noAccount")}</Text>
        <Link href="/sign-up" style={{ color: "#0F766E", fontWeight: "700" }}>
          {t("signUp")}
        </Link>
      </View>
    </Screen>
  );
}
