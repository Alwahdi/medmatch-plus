import React, { useState } from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Badge, Button, Card, ErrorState, Field, KeyValue, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useJob } from "@/lib/queries";
import { employmentTypeLabel, formatDate, formatSalaryRange } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useConsentGate } from "@/components/consent-gate";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const job = useJob(String(id));
  const consent = useConsentGate("applicant_commitments");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const apply = async () => {
    setError(null);
    const ok = await consent.ensure();
    if (!ok) return;
    setBusy(true);
    const { error: err } = await supabase.rpc("submit_job_application", {
      _job_id: String(id),
      ...(cover.trim() ? { _cover_letter: cover.trim() } : {}),
    });
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      return;
    }
    setApplied(true);
  };

  return (
    <>
      <Stack.Screen options={{ title: t("jobs") }} />
      <Screen>
        {job.isPending ? (
          <Loading />
        ) : job.isError ? (
          <ErrorState message={userMessage(job.error, lang)} onRetry={() => void job.refetch()} />
        ) : !job.data ? (
          <ErrorState message={lang === "ar" ? "لم نعد نجد هذه الوظيفة." : "This job is no longer available."} />
        ) : (
          <>
            <Title sub={`${job.data.city} · ${job.data.country}`}>{job.data.title}</Title>
            <Row gap={8} wrap>
              {job.data.facility_verified ? <Badge label={t("verified")} tone="success" /> : null}
              <Badge label={employmentTypeLabel(job.data.employment_type, lang)} />
              <Badge
                label={formatSalaryRange(job.data.salary_min, job.data.salary_max, job.data.currency, lang)}
                tone="primary"
              />
            </Row>

            <Card>
              <KeyValue
                k={t("specialty")}
                v={(lang === "ar" ? job.data.specialty_name_ar : job.data.specialty_name_en) ?? "—"}
              />
              <KeyValue k={t("experience")} v={String(job.data.min_experience ?? 0)} />
              <KeyValue k={t("vacancies")} v={String(job.data.vacancies ?? 1)} />
              <KeyValue k={t("applicants")} v={String(job.data.applications_count ?? 0)} />
              <KeyValue k={t("publishedBy")} v={t("hiddenFacility")} />
              <KeyValue k={t("refresh")} v={formatDate(job.data.created_at, lang)} />
            </Card>

            {job.data.description ? (
              <Card>
                <Text style={ui.body}>{job.data.description}</Text>
              </Card>
            ) : null}

            <Card>
              {applied ? (
                <Text style={ui.body}>{t("applied")}</Text>
              ) : !session ? (
                <Text style={ui.muted}>{t("needSignIn")}</Text>
              ) : (
                <>
                  <Field label={t("coverLetter")} value={cover} onChangeText={setCover} multiline />
                  {error ? <Text style={ui.error}>{error}</Text> : null}
                  <View>
                    <Button label={t("apply")} onPress={apply} loading={busy} />
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
