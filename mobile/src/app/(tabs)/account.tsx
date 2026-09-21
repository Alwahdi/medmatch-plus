import React from "react";
import { Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Bell, Building2, FileText, Globe2, LogOut, ShieldCheck, Stethoscope, UserRound } from "lucide-react-native";
import { Badge, Button, Card, MenuRow, Row, Screen, styles as ui } from "@/components/ui";
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
  const f = facility.data as { name?: string; city?: string | null; is_verified?: boolean } | null;
  const displayName = f?.name ?? p?.full_name ?? user?.email ?? "—";
  const detail = f?.city ?? p?.headline ?? p?.city ?? user?.email ?? "";
  const verified = Boolean(f?.is_verified) || Boolean(p?.is_verified);

  return <Screen>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Brand compact/><Text style={ui.title}>{t("account")}</Text></View>
    <View style={[{ backgroundColor: colors.surface, borderRadius: radii.xl, padding: 20, alignItems: "center", gap: 8 }, raisedShadow]}>
      <View style={{ width: 82, height: 82, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: colors.surface }}><UserRound size={38} color={colors.primary}/></View>
      <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: colors.text, textAlign: "center" }}>{displayName}</Text>
      <Text style={ui.muted}>{detail}</Text>
      <Row gap={6} wrap>{verified ? <Badge label={t("verified")} tone="success"/> : null}{roles.map((r) => <Badge key={r} label={r === "facility" ? t("roleFacility") : r === "professional" ? t("roleProfessional") : "Admin"} tone="primary"/>)}</Row>
    </View>

    {isProfessional && (!p?.headline || !verified) ? (
      <Card style={{ gap: 6, padding: 12, borderColor: colors.primary, backgroundColor: colors.primarySoft }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.text, paddingHorizontal: 4 }}>{t("completeYourProfile")}</Text>
        {!p?.headline ? <MenuRow icon={Stethoscope} title={t("nextPro1")} subtitle={t("nextPro1Sub")} onPress={() => router.push("/profile")}/> : null}
        {!verified ? <MenuRow icon={ShieldCheck} title={t("nextPro2")} subtitle={t("nextPro2Sub")} tone="accent" onPress={() => router.push("/profile")}/> : null}
      </Card>
    ) : null}
    {isFacility && !verified ? (
      <Card style={{ gap: 6, padding: 12, borderColor: colors.primary, backgroundColor: colors.primarySoft }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.text, paddingHorizontal: 4 }}>{t("completeYourProfile")}</Text>
        <MenuRow icon={ShieldCheck} title={t("nextFac2")} subtitle={t("nextFac2Sub")} tone="accent" onPress={() => router.push("/facility")}/>
      </Card>
    ) : null}

    <Text style={[ui.label, { color: colors.textMuted, marginTop: 4 }]}>{lang === "ar" ? "إدارة الحساب" : "ACCOUNT"}</Text>
    {isProfessional ? <MenuRow icon={Stethoscope} title={t("profile")} subtitle={lang === "ar" ? "بياناتك المهنية والسيرة" : "Professional details and CV"} onPress={() => router.push("/profile")}/> : null}
    {isFacility ? <MenuRow icon={Building2} title={t("facilityWorkspace")} subtitle={lang === "ar" ? "الفرص والمتقدمون" : "Listings and applicants"} tone="accent" onPress={() => router.push("/facility")}/> : null}
    <MenuRow icon={Bell} title={t("notifications")} onPress={() => router.push("/notifications")}/>
    <MenuRow icon={ShieldCheck} title={t("legal")} subtitle={lang === "ar" ? "الخصوصية والشروط والموافقات" : "Privacy, terms and consent"} tone="violet" onPress={() => router.push("/legal")}/>

    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Globe2 size={20} color={colors.primary}/><Text style={ui.label}>{t("language")}</Text></View>
      <Row gap={8}><View style={{ flex: 1 }}><Button label={t("arabic")} small variant={lang === "ar" ? "primary" : "secondary"} onPress={() => void setLang("ar")}/></View><View style={{ flex: 1 }}><Button label={t("english")} small variant={lang === "en" ? "primary" : "secondary"} onPress={() => void setLang("en")}/></View></Row>
    </Card>
    {webUrl ? <MenuRow icon={FileText} title={t("openWeb")} subtitle={webUrl.replace(/^https?:\/\//, "")} onPress={() => void Linking.openURL(webUrl)}/> : null}
    <MenuRow icon={LogOut} title={t("signOut")} tone="danger" onPress={() => void signOut()}/>
  </Screen>;
}