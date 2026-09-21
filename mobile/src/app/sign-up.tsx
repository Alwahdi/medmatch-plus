import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { ArrowLeft, Building2, Check, Stethoscope, UserPlus } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button, Card, ErrorState, Field, styles as ui } from "@/components/ui";
import { FormScreen } from "@/components/keyboard";
import { GoogleButton } from "@/components/google-button";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/oauth";
import { userMessage } from "@/lib/errors";
import { colors, fonts, radii } from "@/lib/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Role = "professional" | "facility";

function RoleCard({
  icon: Icon,
  title,
  description,
  active,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 16,
        minHeight: 88,
        borderRadius: radii.lg,
        borderWidth: active ? 2 : 1,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primarySoft : colors.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radii.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? colors.primary : colors.primarySoft,
        }}
      >
        <Icon size={26} color={active ? colors.primaryText : colors.primary} strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text }}>{title}</Text>
        <Text style={ui.muted}>{description}</Text>
      </View>
      {active ? (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
          }}
        >
          <Check size={15} color={colors.primaryText} strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function SignUp() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stepLabel = t("stepOf").replace("{a}", String(step)).replace("{b}", "3");

  const next = () => {
    setError(null);
    if (step === 1) return setStep(2);
    if (step === 2) {
      if (!fullName.trim()) return;
      if (!EMAIL_RE.test(email.trim())) return setError(t("emailInvalid"));
      setStep(3);
      setTimeout(() => passwordRef.current?.focus(), 120);
    }
  };

  const back = () => {
    setError(null);
    setStep((s) => (s === 3 ? 2 : 1));
  };

  const submit = async () => {
    if (!role || !email.trim() || password.length < 8 || !fullName.trim()) return;
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
      <View style={{ alignItems: "center", marginTop: 20, marginBottom: 2 }}>
        <Brand />
      </View>

      <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              backgroundColor: i <= step ? colors.primary : colors.border,
            }}
          />
        ))}
      </View>
      <Text style={[ui.muted, { textAlign: "center" }]}>{stepLabel}</Text>

      <View style={{ gap: 4 }}>
        <Text style={ui.title}>
          {step === 1 ? t("chooseRoleTitle") : step === 2 ? t("detailsStepTitle") : t("passwordCreateTitle")}
        </Text>
        {step === 1 ? <Text style={ui.muted}>{t("chooseRoleSub")}</Text> : null}
      </View>

      {step === 1 ? (
        <View style={{ gap: 12 }}>
          <RoleCard
            icon={Stethoscope}
            title={t("roleProfessional")}
            description={t("roleProfessionalDesc")}
            active={role === "professional"}
            onPress={() => setRole("professional")}
          />
          <RoleCard
            icon={Building2}
            title={t("roleFacility")}
            description={t("roleFacilityDesc")}
            active={role === "facility"}
            onPress={() => setRole("facility")}
          />
          {error ? <ErrorState message={error} /> : null}
          {notice ? <Text style={ui.muted}>{notice}</Text> : null}
          <Button label={t("continueLabel")} onPress={next} disabled={!role || googleBusy} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={ui.muted}>{t("orDivider")}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>
          <GoogleButton label={t("continueWithGoogle")} onPress={google} loading={googleBusy} disabled={busy} />
        </View>
      ) : (
        <Card elevated style={{ gap: 14, padding: 20 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            onPress={back}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 }}
          >
            <ArrowLeft size={18} color={colors.textMuted} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.primary }}>{t("back")}</Text>
          </Pressable>

          {step === 2 ? (
            <>
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
                onSubmitEditing={next}
              />
              {error ? <ErrorState message={error} /> : null}
              <Button label={t("continueLabel")} onPress={next} disabled={!fullName.trim() || !email.trim()} />
            </>
          ) : (
            <>
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
              <Text style={ui.muted}>{t("passwordHint")}</Text>
              {error ? <ErrorState message={error} /> : null}
              {notice ? <Text style={ui.muted}>{notice}</Text> : null}
              <Button
                label={t("signUp")}
                icon={UserPlus}
                onPress={submit}
                loading={busy}
                disabled={password.length < 8}
              />
            </>
          )}
        </Card>
      )}

      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
        <Text style={ui.muted}>{t("haveAccount")}</Text>
        <Link href="/sign-in" style={{ color: colors.primary, fontFamily: fonts.bold }}>
          {t("signIn")}
        </Link>
      </View>
    </FormScreen>
  );
}
