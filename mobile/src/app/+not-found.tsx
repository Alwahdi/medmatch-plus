import React from "react";
import { Stack, useRouter } from "expo-router";
import { Button, EmptyState, Screen } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { lang } = useI18n();
  const router = useRouter();
  return <><Stack.Screen options={{ title: lang === "ar" ? "الصفحة غير متاحة" : "Page unavailable" }} /><Screen>
    <EmptyState text={lang === "ar" ? "لم نعد نجد هذه الصفحة" : "This page isn't available"} desc={lang === "ar" ? "ربما انتهت صلاحية الرابط أو تغير عنوانه." : "This link may have expired or changed."} action={<Button label={lang === "ar" ? "العودة للرئيسية" : "Back to home"} onPress={() => router.replace("/")} />} />
  </Screen></>;
}