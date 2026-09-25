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
  Field,
  KeyValue,
  Loading,
  Row,
  Screen,
  StickyBar,
  Title,
  styles as ui,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useJob, useMyApplications } from "@/lib/queries";
import { employmentTypeLabel, formatDate, formatSalaryRange } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useConsentGate } from "@/components/consent-gate";
import { colors } from "@/lib/theme";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const router = useRouter();
  const { session, isProfessional } = useAuth();
  const job = useJob(String(id));
  const applications = useMyApplications();
  const consent = useConsentGate("applicant_commitments");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const apply = async () => {
    setError(null);
    if (!isProfessional) {
      router.push({ pathname: "/profile", params: { returnTo: `/job/${String(id)}` } });
      return;
    }
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
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setApplied(true);
    void applications.refetch();
    void job.refetch();
  };

  const data = job.data;
  const existingApplication = applications.data?.find((item) => item.job_id === String(id) && item.status !== "withdrawn");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: t("jobs") }} />
      <Screen>
        {job.isPending ? (
          <Loading />
        ) : job.isError ? (
          <ErrorState message={userMessage(job.error, lang)} onRetry={() => void job.refetch()} />
        ) : !data ? (
          <ErrorState message={lang === "ar" ? "لم نعد نجد هذه الوظيفة." : "This job is no longer available."} />
        ) : (
          <>
            <Title sub={`${data.city} · ${data.country}`}>{data.title}</Title>
            <Row gap={8} wrap>
              {data.facility_verified ? <Badge label={t("verified")} tone="success" /> : null}
              <Badge label={employmentTypeLabel(data.employment_type, lang)} />
              <Badge label={formatSalaryRange(data.salary_min, data.salary_max, data.currency, lang)} tone="primary" />
            </Row>

            <Card>
              <KeyValue k={t("specialty")} v={(lang === "ar" ? data.specialty_name_ar : data.specialty_name_en) ?? "—"} />
              <KeyValue k={t("experience")} v={String(data.min_experience ?? 0)} />
              <KeyValue k={t("vacancies")} v={String(data.vacancies ?? 1)} />
              <KeyValue k={t("applicants")} v={String(data.applications_count ?? 0)} />
              <KeyValue k={t("publishedBy")} v={t("hiddenFacility")} />
              <KeyValue k={t("refresh")} v={formatDate(data.created_at, lang)} />
            </Card>

            {data.description ? (
              <Card>
                <Text style={ui.body}>{data.description}</Text>
              </Card>
            ) : null}

            {applied || existingApplication ? (
              <Card style={{ borderColor: colors.success, backgroundColor: colors.successSoft }}>
                <Row gap={8}>
                  <CheckCircle2 size={20} color={colors.success} />
                  <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{applied ? t("applySuccess") : (lang === "ar" ? "قدّمت على هذه الوظيفة سابقاً. تابع حالة طلبك في نشاطي." : "You've already applied. Track your application in Activity.")}</Text>
                </Row>
                <Button label={t("activity")} variant="secondary" small onPress={() => router.push("/activity")} />
              </Card>
            ) : session ? (
              <Card>
                <Field label={t("coverLetter")} value={cover} onChangeText={setCover} multiline />
                {error ? <Text style={ui.error}>{error}</Text> : null}
              </Card>
            ) : null}
          </>
        )}
        {consent.node}
      </Screen>

       {data && !applied && !existingApplication ? (
        <StickyBar>
          {session ? (
             <Button label={t("apply")} onPress={apply} loading={busy} disabled={applications.isPending} />
          ) : (
            <>
              <Text style={ui.muted}>{t("needSignIn")}</Text>
               <Button label={t("signIn")} onPress={() => router.push({ pathname: "/sign-in", params: { returnTo: `/job/${String(id)}` } })} />
            </>
          )}
        </StickyBar>
      ) : null}
    </View>
  );
}
