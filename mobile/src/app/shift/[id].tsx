import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { CheckCircle2 } from "lucide-react-native";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  KeyValue,
  Loading,
  Row,
  Screen,
  StickyBar,
  Title,
  styles as ui,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useMyBookings, useShift } from "@/lib/queries";
import { formatDateTime, formatMoney, relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useConsentGate } from "@/components/consent-gate";
import { colors } from "@/lib/theme";

export default function ShiftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const router = useRouter();
  const { session, isProfessional } = useAuth();
  const shift = useShift(String(id));
  const bookings = useMyBookings();
  const consent = useConsentGate("applicant_commitments");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const book = async () => {
    setError(null);
    if (!isProfessional) {
      router.push({ pathname: "/profile", params: { returnTo: `/shift/${String(id)}` } });
      return;
    }
    const ok = await consent.ensure();
    if (!ok) return;
    setBusy(true);
    const { error: err } = await supabase.rpc("book_open_shift", { _shift_id: String(id) });
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBooked(true);
    void bookings.refetch();
    void shift.refetch();
  };

  const data = shift.data;
  const existingBooking = bookings.data?.find((item) => item.shift_id === id && item.status === "booked");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: t("shifts") }} />
      <Screen>
        {shift.isPending ? (
          <Loading />
        ) : shift.isError ? (
          <ErrorState message={userMessage(shift.error, lang)} onRetry={() => void shift.refetch()} />
        ) : !data ? (
          <ErrorState message={lang === "ar" ? "لم نعد نجد هذه المناوبة." : "This shift is no longer available."} />
        ) : (
          <>
            <Title sub={`${data.city} · ${data.country}`}>{data.title}</Title>
            <Row gap={8} wrap>
              {data.facility_verified ? <Badge label={t("verified")} tone="success" /> : null}
              {data.is_urgent ? <Badge label={t("urgent")} tone="warning" /> : null}
              <Badge label={`${formatMoney(data.hourly_rate, data.currency, lang)} / ${t("perHour")}`} tone="primary" />
            </Row>

            <Card style={{ borderColor: colors.primary, backgroundColor: colors.primarySoft }}>
              <Text style={ui.label}>{t("startsIn").replace("{t}", relativeTime(data.starts_at, lang))}</Text>
              <Text style={ui.body}>{formatDateTime(data.starts_at, lang)}</Text>
            </Card>

            <Card>
              <KeyValue k={t("specialty")} v={(lang === "ar" ? data.specialty_name_ar : data.specialty_name_en) ?? "—"} />
              <KeyValue k={lang === "ar" ? "البداية" : "Starts"} v={formatDateTime(data.starts_at, lang)} />
              <KeyValue k={lang === "ar" ? "النهاية" : "Ends"} v={formatDateTime(data.ends_at, lang)} />
              <KeyValue k={t("publishedBy")} v={t("hiddenFacility")} />
            </Card>

            {data.notes ? (
              <Card>
                <Text style={ui.body}>{data.notes}</Text>
              </Card>
            ) : null}

            {booked || existingBooking ? (
              <Card style={{ borderColor: colors.success, backgroundColor: colors.successSoft }}>
                <Row gap={8}>
                  <CheckCircle2 size={20} color={colors.success} />
                  <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{booked ? t("bookSuccess") : (lang === "ar" ? "هذه المناوبة محجوزة لك. تابعها في نشاطي." : "You booked this shift. Track it in Activity.")}</Text>
                </Row>
                <Button label={t("activity")} variant="secondary" small onPress={() => router.push("/activity")} />
              </Card>
            ) : error ? (
              <Text style={ui.error}>{error}</Text>
            ) : null}
          </>
        )}
        {consent.node}
      </Screen>

       {data && !booked && !existingBooking ? (
        <StickyBar>
          {session ? (
             <Button label={t("book")} onPress={book} loading={busy} disabled={bookings.isPending} />
          ) : (
            <>
              <Text style={ui.muted}>{t("needSignIn")}</Text>
               <Button label={t("signIn")} onPress={() => router.push({ pathname: "/sign-in", params: { returnTo: `/shift/${String(id)}` } })} />
            </>
          )}
        </StickyBar>
      ) : null}
    </View>
  );
}
