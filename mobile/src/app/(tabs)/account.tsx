import React from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Bell, Building2, FileText, Globe2, LogOut, ShieldCheck, Stethoscope, UserRound } from "lucide-react-native";
import { Badge, MenuRow, Row, Screen, ScreenHeader, Segmented, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useMyFacility, useProfessionalProfile } from "@/lib/queries";
import { colors, fonts, radii, space } from "@/lib/theme";

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
  const detail = f?.city ?? p?.headline ?? p?.city ?? (displayName !== user?.email ? user?.email : "");
  const verified = isFacility ? Boolean(f?.is_verified) : isProfessional ? Boolean(p?.is_verified) : false;

  return <Screen>
    <ScreenHeader title={t("account")} sub={lang === "ar" ? "ملفك وإعداداتك" : "Your profile and settings"}/>
    <View style={s.identity}>
      <View style={s.identityTop}>
        <View style={s.avatar}><UserRound size={27} color={colors.primary}/></View>
        <View style={s.identityText}>
          <Text style={s.name} numberOfLines={2}>{displayName}</Text>
          {detail ? <Text style={s.detail} numberOfLines={2}>{detail}</Text> : null}
        </View>
      </View>
      <Row gap={space.sm} wrap>{verified ? <Badge label={t("verified")} tone="success"/> : null}{roles.map((r) => <Badge key={r} label={r === "facility" ? t("roleFacility") : r === "professional" ? t("roleProfessional") : "Admin"} tone="primary"/>)}</Row>
    </View>

    <View style={s.group}>
      <Text style={s.groupTitle}>{lang === "ar" ? "الملف والتوثيق" : "PROFILE & VERIFICATION"}</Text>
      <View style={s.list}>
      {isProfessional ? <View style={s.listItem}><MenuRow plain icon={Stethoscope} title={t("profile")} subtitle={lang === "ar" ? "بياناتك المهنية والسيرة" : "Professional details and CV"} onPress={() => router.push("/profile")}/></View> : null}
      {isFacility ? <View style={s.listItem}><MenuRow plain icon={Building2} title={t("editFacility")} subtitle={lang === "ar" ? "الاسم والنوع والموقع" : "Name, type and location"} onPress={() => router.push("/facility/profile")}/></View> : null}
      <MenuRow
      plain
      icon={ShieldCheck}
      title={lang === "ar" ? "مستندات التوثيق" : "Verification documents"}
       subtitle={verified ? (lang === "ar" ? "حسابك موثّق" : "Your account is verified") : (lang === "ar" ? "قدّم المستندات للمراجعة؛ الشارة بعد اعتمادها" : "Submit documents for review; the badge follows approval")}
      tone={verified ? "primary" : "accent"}
      onPress={() => router.push({ pathname: "/verification", params: { target: isFacility ? "facility" : "professional" } })}
      />
      </View>
    </View>

    <View style={s.group}>
      <Text style={s.groupTitle}>{lang === "ar" ? "الإعدادات" : "SETTINGS"}</Text>
      <View style={s.list}>
      <View style={s.listItem}><MenuRow plain icon={Bell} title={t("notifications")} onPress={() => router.push("/notifications")}/></View>
      <View style={s.languageRow}>
        <View style={s.languageHeading}><View style={s.languageIcon}><Globe2 size={21} color={colors.primary}/></View><Text style={ui.menuTitle}>{t("language")}</Text></View>
        <Segmented value={lang} options={[{ value: "ar", label: t("arabic") }, { value: "en", label: t("english") }]} onChange={(v) => void setLang(v)}/>
      </View>
      <View style={s.listItem}><MenuRow plain icon={FileText} title={t("legal")} subtitle={lang === "ar" ? "الخصوصية والشروط والموافقات" : "Privacy, terms and consent"} tone="violet" onPress={() => router.push("/legal")}/></View>
      {webUrl ? <MenuRow plain icon={FileText} title={t("openWeb")} subtitle={webUrl.replace(/^https?:\/\//, "")} onPress={() => void Linking.openURL(webUrl)}/> : null}
      </View>
    </View>
    <View style={s.signOut}><MenuRow icon={LogOut} title={t("signOut")} tone="danger" onPress={() => void signOut()}/></View>
  </Screen>;
}

const s = StyleSheet.create({
  identity: { paddingHorizontal: space.sm, paddingVertical: space.md, gap: space.md },
  identityTop: { flexDirection: "row", alignItems: "center", gap: space.md },
  identityText: { flex: 1, minWidth: 0, gap: space.xs },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 26, color: colors.primary, writingDirection: "auto" },
  detail: { ...ui.muted, writingDirection: "auto" },
  group: { gap: space.md, marginTop: space.md },
  groupTitle: { ...ui.label, color: colors.textMuted, marginBottom: space.xs },
  list: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: "hidden" },
  listItem: { borderBottomWidth: 1, borderBottomColor: colors.border },
  languageRow: { gap: space.md, padding: space.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  languageHeading: { flexDirection: "row", alignItems: "center", gap: space.lg },
  languageIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  signOut: { marginTop: space.lg, marginBottom: space.xl },
});