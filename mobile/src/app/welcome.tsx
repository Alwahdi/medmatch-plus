import React from "react";
import { Platform, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BriefcaseBusiness, Building2, CircleCheckBig, FileBadge, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react-native";
import { Button, Card, MenuRow, Screen, styles as ui } from "@/components/ui";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { colors, fonts, radii } from "@/lib/theme";

type Step = { icon: LucideIcon; title: string; sub: string; href: "/profile" | "/facility" | "/facility/profile" | "/facility/create-job" | "/(tabs)"; tone?: "primary" | "accent" | "violet" };

export default function Welcome() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; role?: string }>();
  const isFacility = params.role === "facility";
  const name = (params.name ?? "").trim();

  const steps: Step[] = isFacility
    ? [
        { icon: Building2, title: t("nextFac1"), sub: t("nextFac1Sub"), href: "/facility/profile", tone: "accent" },
        { icon: FileBadge, title: t("nextFac2"), sub: t("nextFac2Sub"), href: "/facility/profile", tone: "violet" },
        { icon: BriefcaseBusiness, title: t("nextFac3"), sub: t("nextFac3Sub"), href: "/facility/create-job" },
      ]
    : [
        { icon: Stethoscope, title: t("nextPro1"), sub: t("nextPro1Sub"), href: "/profile" },
        { icon: ShieldCheck, title: t("nextPro2"), sub: t("nextPro2Sub"), href: "/profile", tone: "accent" },
        { icon: BriefcaseBusiness, title: t("nextPro3"), sub: t("nextPro3Sub"), href: "/(tabs)", tone: "violet" },
      ];

  const go = (href: Step["href"]) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    if (href === "/(tabs)") router.replace("/(tabs)");
    else router.replace(href);
  };

  return (
    <Screen>
      <View style={{ alignItems: "center", marginTop: 12 }}>
        <Brand compact />
      </View>

      <View style={{ alignItems: "center", gap: 10, marginTop: 6 }}>
        <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" }}>
          <CircleCheckBig size={36} color={colors.success} strokeWidth={2.2} />
        </View>
        <Text style={[ui.title, { textAlign: "center" }]}>
          {name ? t("welcomeName").replace("{name}", name) : t("welcomeGeneric")}
        </Text>
        <Text style={[ui.muted, { textAlign: "center" }]}>{isFacility ? t("welcomeFacSub") : t("welcomeProSub")}</Text>
      </View>

      <Card style={{ gap: 6, padding: 12 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted, paddingHorizontal: 6, paddingBottom: 4 }}>
          {t("nextStepsTitle")}
        </Text>
        {steps.map((s) => (
          <MenuRow key={s.title} icon={s.icon} title={s.title} subtitle={s.sub} tone={s.tone ?? "primary"} onPress={() => go(s.href)} />
        ))}
      </Card>

      <Button label={t("startNow")} onPress={() => go(steps[0].href)} />
      <Button label={t("laterLabel")} variant="ghost" small onPress={() => go(steps[0].href)} />
      <View style={{ height: radii.lg }} />
    </Screen>
  );
}
