import React, { useState } from "react";
import { Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { UserPlus } from "lucide-react-native";
import { Button, Card, Chip, ErrorState, Field, Row, Screen, styles as ui } from "@/components/ui";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";
import { colors, fonts } from "@/lib/theme";

export default function SignUp() {
  const { t, lang } = useI18n(); const router = useRouter();
  const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [role, setRole] = useState<"professional" | "facility">("professional"); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [notice, setNotice] = useState<string | null>(null);
  const submit = async () => { setBusy(true); setError(null); const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim(), intended_role: role } } }); setBusy(false); if (err) return setError(userMessage(err, lang)); if (!data.session) return setNotice(lang === "ar" ? "أنشأنا حسابك. افتح بريدك لتأكيد التسجيل ثم سجّل الدخول." : "Account created. Confirm your email, then sign in."); router.replace("/(tabs)"); };
  return <Screen>
    <View style={{ alignItems: "center", marginTop: 22, marginBottom: 8 }}><Brand/><Text style={[ui.title, { textAlign: "center", marginTop: 16 }]}>{t("signUp")}</Text></View>
    <Card elevated style={{ gap: 14, padding: 20 }}><Text style={ui.label}>{lang === "ar" ? "أستخدم SyndeoCare بصفتي" : "I am joining as"}</Text><Row gap={8}><View style={{ flex: 1 }}><Chip label={t("roleProfessional")} active={role === "professional"} onPress={() => setRole("professional")}/></View><View style={{ flex: 1 }}><Chip label={t("roleFacility")} active={role === "facility"} onPress={() => setRole("facility")}/></View></Row><Field label={t("fullName")} value={fullName} onChangeText={setFullName}/><Field label={t("email")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/><Field label={t("password")} value={password} onChangeText={setPassword} secureTextEntry/>{error ? <ErrorState message={error}/> : null}{notice ? <Text style={ui.muted}>{notice}</Text> : null}<Button label={t("signUp")} icon={UserPlus} onPress={submit} loading={busy} disabled={!email || password.length < 8 || !fullName}/><Text style={ui.muted}>{lang === "ar" ? "كلمة المرور 8 أحرف على الأقل." : "Use at least 8 characters."}</Text></Card>
    <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}><Text style={ui.muted}>{t("haveAccount")}</Text><Link href="/sign-in" style={{ color: colors.primary, fontFamily: fonts.bold }}>{t("signIn")}</Link></View>
  </Screen>;
}