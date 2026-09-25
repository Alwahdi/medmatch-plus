import React from "react";
import { Text } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Badge, Card, EmptyState, ErrorState, KeyValue, Loading, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useFacilityShift, useMyFacility } from "@/lib/queries";
import { bookingStatusLabel, formatDateTime, formatMoney } from "@/lib/format";
import { userMessage } from "@/lib/errors";

export default function FacilityShiftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const facility = useMyFacility();
  const shift = useFacilityShift(String(id), facility.data?.id);
  const data = shift.data;
  return <><Stack.Screen options={{ title: t("shifts") }} /><Screen>
    <ScreenHeader title={t("shifts")} sub={lang === "ar" ? "تفاصيل مناوبتك" : "Your shift details"} />
    {facility.isPending || (Boolean(facility.data) && shift.isPending) ? <Loading /> : facility.isError || shift.isError ?
      <ErrorState message={userMessage(facility.error ?? shift.error, lang)} onRetry={() => { void facility.refetch(); void shift.refetch(); }} /> : !data ?
      <EmptyState text={lang === "ar" ? "لم نعد نجد هذه المناوبة ضمن فرص منشأتك." : "This shift is not in your facility listings."} /> : <>
        <Text style={ui.title}>{data.title}</Text>
        <Badge label={bookingStatusLabel(data.status, lang)} tone={data.status === "open" ? "success" : "neutral"} />
        <Card>
          <KeyValue k={t("startsAt")} v={formatDateTime(data.starts_at, lang)} />
          <KeyValue k={t("endsAt")} v={formatDateTime(data.ends_at, lang)} />
          <KeyValue k={t("city")} v={data.city} />
          <KeyValue k={t("hourlyRate")} v={formatMoney(data.hourly_rate, data.currency, lang)} />
        </Card>
        {data.notes ? <Text style={ui.body}>{data.notes}</Text> : null}
        <Text style={ui.muted}>{lang === "ar" ? "إدارة حجوزات المناوبة وإغلاقها غير متاحين داخل التطبيق بعد." : "Shift booking management and closing are not yet available in the app."}</Text>
      </>}
  </Screen></>;
}
