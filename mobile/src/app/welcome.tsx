import React, { useCallback } from "react";
import { Platform, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Redirect, Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { BriefcaseBusiness, Building2, CircleCheckBig, FileBadge, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react-native";
import { Badge, Button, ErrorState, Loading, Screen, styles as ui } from "@/components/ui";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { colors, fonts, radii, space } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useDocumentRequirements, useMyFacility, useProfessionalProfile, useVerificationDocuments } from "@/lib/queries";
import { userMessage } from "@/lib/errors";

type Destination = "/profile" | "/facility/profile" | "/facility/create-job" | "/verification" | "/(tabs)/discover";
type Step = { icon: LucideIcon; title: string; sub: string; href: Destination; status: "done" | "pending" | "current" | "optional"; target?: "professional" | "facility" };

export default function Welcome() {
  const { t, lang } = useI18n();
  const { user, roles, rolesError, refreshRoles, loading } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; role?: string }>();
  const isFacility = roles.includes("facility") || (roles.length === 0 && (user?.user_metadata?.intended_role === "facility" || params.role === "facility"));
  const target = isFacility ? "facility" : "professional";
  const facility = useMyFacility();
  const professional = useProfessionalProfile();
  const currentProfile = isFacility ? facility : professional;
  const requirements = useDocumentRequirements(target);
  const documents = useVerificationDocuments(target, facility.data?.id);
  const hasRole = roles.includes(target);
  const profileReady = hasRole && Boolean(isFacility ? facility.data?.id : professional.data?.id);
  const submitted = (documents.data ?? []).some((d) => d.status === "pending");
  const rejected = (documents.data ?? []).some((d) => d.status === "rejected");
  const verified = isFacility ? Boolean(facility.data?.is_verified) : Boolean(professional.data?.is_verified);
  const name = (params.name ?? user?.user_metadata?.full_name ?? "").trim();

  useFocusEffect(useCallback(() => {
    if (!user) return;
    void refreshRoles();
    void currentProfile.refetch();
    void documents.refetch();
  }, [user?.id, target]));

  if (loading) return <Screen><Loading rows={2} /></Screen>;
  if (!user) return <Redirect href="/sign-in" />;

  const steps: Step[] = isFacility ? [
    { icon: Building2, title: t("nextFac1"), sub: t("nextFac1Sub"), href: "/facility/profile", status: profileReady ? "done" : "current" },
    { icon: FileBadge, title: t("nextFac2"), sub: t("nextFac2Sub"), href: "/verification", target: "facility", status: verified ? "done" : profileReady ? "current" : "pending" },
    { icon: BriefcaseBusiness, title: t("nextFac3"), sub: t("nextFac3Sub"), href: "/facility/create-job", status: verified ? "current" : "pending" },
  ] : [
    { icon: Stethoscope, title: t("nextPro1"), sub: t("nextPro1Sub"), href: "/profile", status: profileReady ? "done" : "current" },
    { icon: ShieldCheck, title: t("nextPro2"), sub: t("nextPro2Sub"), href: "/verification", target: "professional", status: verified ? "done" : profileReady ? "current" : "pending" },
    { icon: BriefcaseBusiness, title: t("nextPro3"), sub: t("nextPro3Sub"), href: "/(tabs)/discover", status: profileReady ? "optional" : "pending" },
  ];
  const go = (step: Step) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    if (step.href === "/verification") router.push({ pathname: "/verification", params: { target: step.target ?? target } });
    else router.push(step.href);
  };

  return <><Stack.Screen options={{ headerShown: false }} /><Screen>
    <View style={{ alignItems: "center", marginTop: space.lg, marginBottom: space.xl }}><Brand compact /></View>
    <View style={{ gap: 6, marginBottom: space.section }}>
      <Text style={[ui.muted, { color: colors.primary, fontFamily: fonts.bold }]}>{isFacility ? t("roleFacility") : t("roleProfessional")}</Text>
      <Text accessibilityRole="header" style={ui.title}>{name ? t("welcomeName").replace("{name}", name) : t("welcomeGeneric")}</Text>
      <Text style={ui.muted}>{isFacility ? t("welcomeFacSub") : t("welcomeProSub")}</Text>
    </View>
    {rolesError ? <ErrorState message={userMessage(rolesError, lang)} onRetry={() => void refreshRoles()} /> : currentProfile.isPending || requirements.isPending || (profileReady && documents.isPending) ? <Loading rows={2} /> : currentProfile.isError || requirements.isError || (profileReady && documents.isError) ? <ErrorState message={userMessage(currentProfile.error ?? requirements.error ?? documents.error, lang)} onRetry={() => { void currentProfile.refetch(); void requirements.refetch(); void documents.refetch(); }} /> : <>
      <View style={{ marginBottom: space.lg, gap: space.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={ui.bodyStrong}>{t("nextStepsTitle")}</Text>
          <Text style={ui.muted}>{steps.filter((step) => step.status === "done").length} / {steps.length}</Text>
        </View>
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length, now: steps.filter((step) => step.status === "done").length }} style={{ height: 4, backgroundColor: colors.border, borderRadius: radii.sm, overflow: "hidden" }}>
          <View style={{ width: `${steps.filter((step) => step.status === "done").length / steps.length * 100}%`, height: "100%", backgroundColor: colors.primary }} />
        </View>
      </View>
      <View style={{ gap: space.md }}>
        {steps.map((step, index) => <View key={step.href} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: step.status === "current" ? colors.primary : colors.border, borderRadius: radii.lg, padding: space.lg, gap: space.sm }}>
           <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
            <View style={{ width: 42, height: 42, borderRadius: radii.md, backgroundColor: step.status === "done" ? colors.successSoft : colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
              {step.status === "done" ? <CircleCheckBig size={22} color={colors.success} /> : <step.icon size={22} color={colors.primary} />}
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingBottom: space.xs }}><Text style={[ui.bodyStrong, { color: colors.text }]}>{index + 1}. {step.title}</Text><Text style={[ui.muted, { lineHeight: 24 }]}>{step.sub}</Text>{step.href === "/verification" && profileReady && !verified ? <Text style={[ui.muted, { lineHeight: 24, color: rejected ? colors.danger : submitted ? colors.warning : colors.textMuted }]}>{rejected ? (lang === "ar" ? "يلزم تعديل مستند" : "A document needs attention") : submitted ? (lang === "ar" ? "بانتظار مراجعة الإدارة" : "Awaiting review") : (lang === "ar" ? "لم يبدأ التوثيق بعد" : "Verification not started")}</Text> : null}</View>
          </View>
          {step.status === "done" ? <View style={{ alignSelf: "flex-start" }}><Badge label={lang === "ar" ? "مكتمل" : "Completed"} tone="success" /></View> : step.status === "current" || step.status === "optional" ? <Button label={step.status === "optional" ? (lang === "ar" ? "تصفح الفرص" : "Browse opportunities") : (lang === "ar" ? "متابعة" : "Continue")} small variant={step.status === "optional" ? "secondary" : "primary"} onPress={() => go(step)} /> : null}
        </View>)}
      </View>
      {profileReady && !verified && (submitted || rejected) ? <View style={{ backgroundColor: rejected ? colors.dangerSoft : colors.warningSoft, padding: space.lg, borderRadius: radii.md, marginTop: space.lg }}><Text style={ui.bodyStrong}>{rejected ? (lang === "ar" ? "مستند يحتاج تعديلًا" : "A document needs attention") : (lang === "ar" ? "المستندات قيد المراجعة" : "Documents under review")}</Text><Text style={ui.muted}>{rejected ? (lang === "ar" ? "اطلع على سبب الرفض في صفحة التوثيق." : "See the review note on the verification page.") : (lang === "ar" ? "لا تُمنح شارة التوثيق حتى توافق الإدارة." : "Verification is only granted after approval.")}</Text></View> : null}
      {profileReady ? <View style={{ marginTop: space.xl, gap: space.sm }}><Button label={isFacility ? (lang === "ar" ? "الانتقال إلى مساحة المنشأة" : "Go to facility workspace") : (lang === "ar" ? "الانتقال إلى التطبيق" : "Go to app")} variant="ghost" onPress={() => router.replace("/(tabs)")} /></View> : null}
    </>}
   </Screen></>;
}