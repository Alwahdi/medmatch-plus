import React, { useState } from "react";
import { Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Button, Card, Chip, ErrorState, Field, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";

export default function SignUp() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"professional" | "facility">("professional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), intended_role: role } },
    });
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      return;
    }
    if (!data.session) {
      setNotice(
        lang === "ar"
          ? "أنشأنا حسابك. افتح بريدك لتأكيد التسجيل ثم سجّل الدخول."
          : "Account created. Confirm your email, then sign in.",
      );
      return;
    }
    router.replace("/(tabs)");
  };

  return (
    <Screen>
      <View style={{ marginTop: 24 }}>
        <Title sub={t("tagline")}>{t("signUp")}</Title>
      </View>
      <Card style={{ gap: 12 }}>
        <Text style={ui.label}>{lang === "ar" ? "نوع الحساب" : "Account type"}</Text>
        <Row gap={8} wrap>
          <Chip
            label={t("roleProfessional")}
            active={role === "professional"}
            onPress={() => setRole("professional")}
          />
          <Chip label={t("roleFacility")} active={role === "facility"} onPress={() => setRole("facility")} />
        </Row>
        <Field label={t("fullName")} value={fullName} onChangeText={setFullName} />
        <Field
          label={t("email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field label={t("password")} value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <ErrorState message={error} /> : null}
        {notice ? <Text style={ui.muted}>{notice}</Text> : null}
        <Button
          label={t("signUp")}
          onPress={submit}
          loading={busy}
          disabled={!email || password.length < 8 || !fullName}
        />
        <Text style={ui.muted}>
          {lang === "ar"
            ? "يجب ألا تقل كلمة المرور عن 8 أحرف."
            : "Password must be at least 8 characters."}
        </Text>
      </Card>
      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
        <Text style={ui.muted}>{t("haveAccount")}</Text>
        <Link href="/sign-in" style={{ color: "#0F766E", fontWeight: "700" }}>
          {t("signIn")}
        </Link>
      </View>
    </Screen>
  );
}
