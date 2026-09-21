import React from "react";
import { Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Bell, Building2, FileText, Globe2, LogOut, ShieldCheck, Stethoscope, UserRound } from "lucide-react-native";
import { Badge, Button, Card, MenuRow, Row, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useMyFacility, useProfessionalProfile } from "@/lib/queries";
import { colors, fonts, radii, raisedShadow } from "@/lib/theme";

export default function AccountTab() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const { user, roles, isFacility, isProfessional, signOut } = useAuth();
  const professional = useProfessionalProfile();
  const facility = useMyFacility();
  const webUrl = (Constants.expoConfig?.extra as { webUrl?: string } | undefined)?.webUrl;
  const p = professional.data as { full_name?: string; headline?: string | null; city?: string | null; is_verified?: boolean } | null;
  const f = facility.data as { name_ar?: string; name_en?: string | null; city?: string | null; is_verified?: boolean } | null;
  const displayName = (lang === "ar" ? f?.name_ar : f?.name_en || f?.name_ar) ?? p?.full_name ?? user?.email ?? "—";
  const detail = f?.city ?? p?.headline ?? p?.city ?? user?.email ?? "";
  const verified = Boolean(f?.is_verified) || Boolean(p?.is_verified);

  return <Screen>
    <ScreenHeader title={t("account")} sub={lang === "ar" ? "ملفك وإعداداتك" : "Your profile and settings"}/>
    <View style={[{ backgroundColor: colors.surface, borderRadius: radii.xl, padding: 20, alignItems: "center", gap: 8 }, raisedShadow]}>
      <View style={{ width: 82, height: 82, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: colors.surface }}><UserRound size={38} color={colors.primary}/></View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: colors.text, textAlign: "center" }}>{displayName}</Text>
      {detail ? <Text style={ui.muted}>{detail}</Text> : null}
      <Row gap={6} wrap>{verified ? <Badge label={t("verified")} tone="success"/> : null}{roles.map((r) => <Badge key={r} label={r === "facility" ? t("roleFacility") : r === "professional" ? t("roleProfessional") : "Admin"} tone="primary"/>)}</Row>
    </View>

    <Text style={[ui.label, { color: colors.textMuted, marginTop: 4 }]}>{lang === "ar" ? "إدارة الحساب" : "ACCOUNT"}</Text>
    {isProfessional ? <MenuRow icon={Stethoscope} title={t("profile")} subtitle={lang === "ar" ? "بياناتك المهنية والسيرة" : "Professional details and CV"} onPress={() => router.push("/profile")}/> : null}
    {isFacility ? <><MenuRow icon={Building2} title={t("facilityWorkspace")} subtitle={lang === "ar" ? "الفرص والمتقدمون" : "Listings and applicants"} tone="accent" onPress={() => router.push("/facility")}/><MenuRow icon={UserRound} title={t("editFacility")} subtitle={lang === "ar" ? "الاسم والنوع والموقع" : "Name, type and location"} onPress={() => router.push("/facility/profile")}/></> : null}
    <MenuRow
      icon={ShieldCheck}
      title={lang === "ar" ? "مستندات التوثيق" : "Verification documents"}
      subtitle={verified ? (lang === "ar" ? "حسابك موثّق" : "Your account is verified") : (lang === "ar" ? "ارفع مستنداتك للحصول على شارة التوثيق" : "Upload documents to get the verified badge")}
      tone={verified ? "primary" : "accent"}
      onPress={() => router.push({ pathname: "/verification", params: { target: isFacility ? "facility" : "professional" } })}
    />
    <MenuRow icon={Bell} title={t("notifications")} onPress={() => router.push("/notifications")}/>
    <MenuRow icon={FileText} title={t("legal")} subtitle={lang === "ar" ? "الخصوصية والشروط والموافقات" : "Privacy, terms and consent"} tone="violet" onPress={() => router.push("/legal")}/>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}>
      <View style={{ width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}><Globe2 size={21} color={colors.primary}/></View>
      <Text style={[ui.menuTitle, { flex: 1 }]}>{t("language")}</Text>
      <View style={{ width: 168 }}>
        <Segmented value={lang} options={[{ value: "ar", label: t("arabic") }, { value: "en", label: t("english") }]} onChange={(v) => void setLang(v)}/>
      </View>
    </View>

    {webUrl ? <MenuRow icon={FileText} title={t("openWeb")} subtitle={webUrl.replace(/^https?:\/\//, "")} onPress={() => void Linking.openURL(webUrl)}/> : null}
    <MenuRow icon={LogOut} title={t("signOut")} tone="danger" onPress={() => void signOut()}/>
  </Screen>;
}