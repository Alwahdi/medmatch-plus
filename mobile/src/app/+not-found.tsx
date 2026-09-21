import React from "react";
import { useRouter } from "expo-router";
import { CircleHelp } from "lucide-react-native";
import { Button, EmptyState, Screen } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <Screen scroll={false}>
      <EmptyState
        icon={CircleHelp}
        text={t("pageNotFound")}
        action={<Button label={t("backHome")} onPress={() => router.replace("/")} />}
      />
    </Screen>
  );
}