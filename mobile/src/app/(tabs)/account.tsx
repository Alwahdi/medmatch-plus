import React from "react";
import { Linking, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Badge, Button, Card, KeyValue, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useMyFacility, useProfessionalProfile } from "@/lib/queries";

export default function AccountTab() {
  const { t, lang, setLang } = useI18n();
  const router = useRouter();
  const { user, roles, isFacility, isProfessional, signOut } = useAuth();
  const professional = useProfessionalProfile();
  const facility = useMyFacility();
  const webUrl = (Constants.expoConfig?.extra as { webUrl?: string } | undefined)?.webUrl;

  const displayName =
    (facility.data as { name?: string } | null)?.name ??
    (professional.data as { full_name?: string } | null)?.full_name ??
    user?.email ??
    "—";
  const verified =
    Boolean((facility.data as { is_verified?: boolean } | null)?.is_verified) ||
    Boolean((professional.data as { is_verified?: boolean } | null)?.is_verified);

  return (
    <Screen>
      <Title>{t("account")}</Title>

      <Card>
        <Row gap={8} wrap>
          <Text style={[ui.body, { fontWeight: "700", flexShrink: 1 }]}>{displayName}</Text>
          {verified ? <Badge label={t("verified")} tone="success" /> : null}
        </Row>
        <Text style={ui.muted}>{user?.email}</Text>
        <Row gap={6} wrap>
          {roles.map((r) => (
            <Badge key={r} label={r === "facility" ? t("roleFacility") : r === "professional" ? t("roleProfessional") : "Admin"} tone="primary" />
          ))}
        </Row>
      </Card>

      {isProfessional ? (
        <Button label={t("profile")} variant="secondary" onPress={() => router.push("/profile")} />
      ) : null}
      {isFacility ? (
        <Button label={t("facilityWorkspace")} variant="secondary" onPress={() => router.push("/facility")} />
      ) : null}
      <Button label={t("notifications")} variant="secondary" onPress={() => router.push("/notifications")} />
      <Button label={t("legal")} variant="secondary" onPress={() => router.push("/legal")} />

      <Card>
        <Text style={ui.label}>{t("language")}</Text>
        <Row gap={8}>
          <View style={{ flex: 1 }}>
            <Button label={t("arabic")} small variant={lang === "ar" ? "primary" : "secondary"} onPress={() => void setLang("ar")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={t("english")} small variant={lang === "en" ? "primary" : "secondary"} onPress={() => void setLang("en")} />
          </View>
        </Row>
        <Text style={ui.muted}>{t("restartNeeded")}</Text>
      </Card>

      {webUrl ? (
        <Card>
          <KeyValue k={t("openWeb")} v={webUrl.replace(/^https?:\/\//, "")} />
          <Button label={t("openWeb")} variant="ghost" small onPress={() => void Linking.openURL(webUrl)} />
        </Card>
      ) : null}

      <Button label={t("signOut")} variant="danger" onPress={() => void signOut()} />
    </Screen>
  );
}
