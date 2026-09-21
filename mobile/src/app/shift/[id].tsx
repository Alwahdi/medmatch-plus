import React, { useState } from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Badge, Button, Card, ErrorState, KeyValue, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useShift } from "@/lib/queries";
import { formatDateTime, formatMoney } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useConsentGate } from "@/components/consent-gate";

export default function ShiftDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const shift = useShift(String(id));
  const consent = useConsentGate("applicant_commitments");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const book = async () => {
    setError(null);
    const ok = await consent.ensure();
    if (!ok) return;
    setBusy(true);
    const { error: err } = await supabase.rpc("book_open_shift", { _shift_id: String(id) });
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      return;
    }
    setBooked(true);
  };

  return (
    <>
      <Stack.Screen options={{ title: t("shifts") }} />
      <Screen>
        {shift.isPending ? (
          <Loading />
        ) : shift.isError ? (
          <ErrorState message={userMessage(shift.error, lang)} onRetry={() => void shift.refetch()} />
        ) : !shift.data ? (
          <ErrorState message={lang === "ar" ? "لم نعد نجد هذه المناوبة." : "This shift is no longer available."} />
        ) : (
          <>
            <Title sub={`${shift.data.city} · ${shift.data.country}`}>{shift.data.title}</Title>
            <Row gap={8} wrap>
              {shift.data.facility_verified ? <Badge label={t("verified")} tone="success" /> : null}
              {shift.data.is_urgent ? <Badge label={lang === "ar" ? "عاجلة" : "Urgent"} tone="warning" /> : null}
              <Badge
                label={`${formatMoney(shift.data.hourly_rate, shift.data.currency, lang)} / ${lang === "ar" ? "ساعة" : "hr"}`}
                tone="primary"
              />
            </Row>

            <Card>
              <KeyValue
                k={t("specialty")}
                v={(lang === "ar" ? shift.data.specialty_name_ar : shift.data.specialty_name_en) ?? "—"}
              />
              <KeyValue k={lang === "ar" ? "البداية" : "Starts"} v={formatDateTime(shift.data.starts_at, lang)} />
              <KeyValue k={lang === "ar" ? "النهاية" : "Ends"} v={formatDateTime(shift.data.ends_at, lang)} />
              <KeyValue k={t("publishedBy")} v={t("hiddenFacility")} />
            </Card>

            {shift.data.notes ? (
              <Card>
                <Text style={ui.body}>{shift.data.notes}</Text>
              </Card>
            ) : null}

            <Card>
              {booked ? (
                <Text style={ui.body}>{t("booked")}</Text>
              ) : !session ? (
                <Text style={ui.muted}>{t("needSignIn")}</Text>
              ) : (
                <>
                  {error ? <Text style={ui.error}>{error}</Text> : null}
                  <View>
                    <Button label={t("book")} onPress={book} loading={busy} />
                  </View>
                </>
              )}
            </Card>
          </>
        )}
        {consent.node}
      </Screen>
    </>
  );
}
