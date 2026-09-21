import React, { useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Link, useRouter } from "expo-router";
import { Building2, Check, Stethoscope, UserPlus } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Button, ErrorState, Field, styles as ui } from "@/components/ui";
import { AuthScaffold } from "@/components/auth-scaffold";
import { GoogleButton } from "@/components/google-button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/oauth";
import { userMessage } from "@/lib/errors";
import { colors, fonts, radii } from "@/lib/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Role = "professional" | "facility";

function passwordScore(pw: string) {
  if (pw.length < 8) return 0;
  let score = 1;
  if (pw.length >= 12) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return score; // 0..4
}

function RoleCard({ icon: Icon, title, description, active, onPress }: {
  icon: LucideIcon; title: string; description: string; active: boolean; onPress: () => void;
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
      <View style={{
        width: 52, height: 52, borderRadius: radii.md, alignItems: "center", justifyContent: "center",
        backgroundColor: active ? colors.primary : colors.primarySoft,
      }}>
        <Icon size={26} color={active ? colors.primaryText : colors.primary} strokeWidth={2.1} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.text }}>{title}</Text>
        <Text style={ui.muted}>{description}</Text>
      </View>
      {active ? (
        <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary }}>
          <Check size={15} color={colors.primaryText} strokeWidth={3} />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function SignUp() {
  const { t, lang, rtl } = useI18n();
  const router = useRouter();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({});

  const nameError = touched.name && !fullName.trim() ? t("nameRequired") : null;
  const emailError = touched.email && email.trim() && !EMAIL_RE.test(email.trim()) ? t("emailInvalid") : null;
  const score = passwordScore(password);
  const confirmMismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = Boolean(role) && Boolean(fullName.trim()) && EMAIL_RE.test(email.trim()) && password.length >= 8 && password === confirm;

  const pickRole = (r: Role) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    setRole(r);
  };

  const next = () => {
    setError(null);
    if (step === 1) return setStep(2);
    if (step === 2) {
      setTouched({ name: true, email: true });
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
    if (!canSubmit || busy) return;
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
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/welcome", params: { name: fullName.trim(), role: role ?? "professional" } });
  };

  const google = async () => {
    if (!role) return setError(t("chooseRoleSub"));
    setGoogleBusy(true);
    setError(null);
    setNotice(null);
    const result = await signInWithGoogle(role);
    setGoogleBusy(false);
    if (result.ok) return router.replace({ pathname: "/welcome", params: { role } });
    if (result.cancelled) return setNotice(t("googleCancelled"));
    setError(result.error ? userMessage(result.error, lang) : t("googleFailed"));
  };

  const strengthColors = [colors.danger, colors.warning, colors.success];
  const strengthLabels = [t("strengthWeak"), t("strengthMedium"), t("strengthStrong")];
  const strengthIdx = score >= 4 ? 2 : score >= 2 ? 1 : 0;

  return (
    <AuthScaffold
      step={step}
      totalSteps={3}
      onBack={step > 1 ? back : undefined}
      title={step === 1 ? t("chooseRoleTitle") : step === 2 ? t("detailsStepTitle") : t("passwordCreateTitle")}
      sub={step === 1 ? t("chooseRoleSub") : undefined}
    >
      {step === 1 ? (
        <View style={{ gap: 12 }}>
          <RoleCard icon={Stethoscope} title={t("roleProfessional")} description={t("roleProfessionalDesc")} active={role === "professional"} onPress={() => pickRole("professional")} />
          <RoleCard icon={Building2} title={t("roleFacility")} description={t("roleFacilityDesc")} active={role === "facility"} onPress={() => pickRole("facility")} />
          {error ? <ErrorState message={error} /> : null}
          {notice ? <Text style={ui.muted}>{notice}</Text> : null}
          <Button label={t("continueLabel")} onPress={next} disabled={!role || googleBusy} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={ui.muted}>{t("orDivider")}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>
          <GoogleButton label={t("continueWithGoogle")} onPress={google} loading={googleBusy} disabled={busy} />
          <Text style={[ui.muted, { textAlign: "center" }]}>{t("googleRoleNotice")}</Text>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.primarySoft, flexDirection: "row", alignItems: "center", gap: 6 }}>
              {role === "facility" ? <Building2 size={14} color={colors.primary} /> : <Stethoscope size={14} color={colors.primary} />}
              <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.primary }}>
                {role === "facility" ? t("roleFacility") : t("roleProfessional")}
              </Text>
            </View>
          </View>
          <Field
            label={t("fullName")}
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => setTouched((s) => ({ ...s, name: true }))}
            error={nameError}
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
            onBlur={() => setTouched((s) => ({ ...s, email: true }))}
            error={emailError}
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
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: 14 }}>
          <View style={{ gap: 8, padding: 14, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted }}>{t("summaryTitle")}</Text>
            <Text style={[ui.bodyStrong, { writingDirection: "auto" }]}>{fullName.trim()}</Text>
            <Text style={[ui.muted, { writingDirection: "auto", textAlign: rtl ? "right" : "left" }]}>{email.trim()}</Text>
            <Text style={ui.muted}>
              {t("accountType")}: {role === "facility" ? t("roleFacility") : t("roleProfessional")}
            </Text>
          </View>

          <Field
            ref={passwordRef}
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          {password.length > 0 ? (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", gap: 5 }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: password.length >= 8 && i <= strengthIdx ? strengthColors[strengthIdx] : colors.border,
                    }}
                  />
                ))}
              </View>
              <Text style={ui.muted}>
                {t("strengthLabel")}: {password.length < 8 ? t("passwordHint") : strengthLabels[strengthIdx]}
              </Text>
            </View>
          ) : (
            <Text style={ui.muted}>{t("passwordHint")}</Text>
          )}

          <Field
            ref={confirmRef}
            label={t("confirmPassword")}
            value={confirm}
            onChangeText={setConfirm}
            error={confirmMismatch ? t("passwordsDontMatch") : null}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="go"
            onSubmitEditing={() => void submit()}
          />

          <Text style={[ui.muted, { textAlign: "center" }]}>
            {t("agreePrefix")}{" "}
            <Text style={{ color: colors.primary, fontFamily: fonts.semibold }} onPress={() => router.push("/legal")}>
              {t("terms")}
            </Text>{" "}
            {t("andWord")}{" "}
            <Text style={{ color: colors.primary, fontFamily: fonts.semibold }} onPress={() => router.push("/legal")}>
              {t("privacy")}
            </Text>
          </Text>

          {error ? <ErrorState message={error} /> : null}
          {notice ? <Text style={ui.muted}>{notice}</Text> : null}
          <Button label={t("signUp")} icon={UserPlus} onPress={submit} loading={busy} disabled={!canSubmit} />
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
        <Text style={ui.muted}>{t("haveAccount")}</Text>
        <Link href="/sign-in" style={{ color: colors.primary, fontFamily: fonts.bold }}>
          {t("signIn")}
        </Link>
      </View>
    </AuthScaffold>
  );
}
