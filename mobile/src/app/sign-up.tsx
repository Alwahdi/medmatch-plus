import React, { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { UserPlus } from "lucide-react-native";
import { Button, Card, Chip, ErrorState, Field, Row, styles as ui } from "@/components/ui";
import { FormScreen } from "@/components/keyboard";
import { GoogleButton } from "@/components/google-button";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/oauth";
import { userMessage } from "@/lib/errors";
import { colors, fonts } from "@/lib/theme";

export default function SignUp() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"professional" | "facility">("professional");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || password.length < 8 || !fullName.trim()) return;
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), intended_role: role } },
    });
    setBusy(false);
    if (err) return setError(userMessage(err, lang));
    if (!data.session)
      return setNotice(
        lang === "ar"
          ? "أنشأنا حسابك. افتح بريدك لتأكيد التسجيل ثم سجّل الدخول."
          : "Account created. Confirm your email, then sign in.",
      );
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

  return (
    <FormScreen>
      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 6 }}>
        <Brand />
        <Text style={[ui.title, { textAlign: "center", marginTop: 16 }]}>{t("signUp")}</Text>
      </View>

      <Card elevated style={{ gap: 14, padding: 20 }}>
        <GoogleButton label={t("continueWithGoogle")} onPress={google} loading={googleBusy} disabled={busy} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text style={ui.muted}>{t("orDivider")}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>

        <Text style={ui.label}>{lang === "ar" ? "أستخدم SyndeoCare بصفتي" : "I am joining as"}</Text>
        <Row gap={8}>
          <View style={{ flex: 1 }}>
            <Chip label={t("roleProfessional")} active={role === "professional"} onPress={() => setRole("professional")} />
          </View>
          <View style={{ flex: 1 }}>
            <Chip label={t("roleFacility")} active={role === "facility"} onPress={() => setRole("facility")} />
          </View>
        </Row>

        <Field
          label={t("fullName")}
          value={fullName}
          onChangeText={setFullName}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <Field
          ref={emailRef}
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
          textContentType="newPassword"
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        {error ? <ErrorState message={error} /> : null}
        {notice ? <Text style={ui.muted}>{notice}</Text> : null}
        <Button
          label={t("signUp")}
          icon={UserPlus}
          onPress={submit}
          loading={busy}
          disabled={!email || password.length < 8 || !fullName || googleBusy}
        />
        <Text style={ui.muted}>{lang === "ar" ? "كلمة المرور 8 أحرف على الأقل." : "Use at least 8 characters."}</Text>
      </Card>

      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
        <Text style={ui.muted}>{t("haveAccount")}</Text>
        <Link href="/sign-in" style={{ color: colors.primary, fontFamily: fonts.bold }}>
          {t("signIn")}
        </Link>
      </View>
    </FormScreen>
  );
}
