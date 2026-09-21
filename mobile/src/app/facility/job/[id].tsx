import React, { useState } from "react";
import { Alert, RefreshControl, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useHireApplicant, useInviteSuggestedCandidate, useJob, useJobApplicants, useScheduleInterview, useSetApplicationStage, useSuggestedCandidates } from "@/lib/queries";
import { applicationStatusLabel, formatDate } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { ShieldCheck, UserRound } from "lucide-react-native";

const STAGES = ["reviewing", "shortlisted", "interview", "rejected"] as const;

export default function FacilityJobApplicants() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const job = useJob(String(id));
  const applicants = useJobApplicants(String(id));
  const setStage = useSetApplicationStage(String(id));
  const suggested = useSuggestedCandidates(String(id));
  const invite = useInviteSuggestedCandidate(String(id));
  const schedule = useScheduleInterview(String(id));
  const hire = useHireApplicant(String(id));
  const [changingId, setChangingId] = useState<string | null>(null);
  const [interviewingId, setInterviewingId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");

  const changeStage = (applicationId: string, status: typeof STAGES[number]) => {
    Alert.alert(
      t("confirmAction"),
      `${t("actionCannotUndo")}\n${applicationStatusLabel(status, lang)}`,
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("confirmAction"), style: status === "rejected" ? "destructive" : "default", onPress: () => {
          setChangingId(applicationId);
          setStage.mutate({ id: applicationId, status }, { onSettled: () => setChangingId(null) });
        } },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: t("applicants") }} />
      <Screen
        refreshControl={
          <RefreshControl refreshing={applicants.isFetching} onRefresh={() => void applicants.refetch()} />
        }
      >
        <Title sub={t("applicants")}>{job.data?.title ?? "—"}</Title>

        {applicants.isPending ? (
          <Loading />
        ) : applicants.isError ? (
          <ErrorState message={userMessage(applicants.error, lang)} onRetry={() => void applicants.refetch()} />
        ) : (applicants.data ?? []).length === 0 ? (
          <EmptyState text={lang === "ar" ? "لا يوجد متقدمون بعد." : "No applicants yet."} />
        ) : (
          (applicants.data ?? []).map((a) => {
            const professional = (a as unknown as { professional?: { full_name?: string; headline?: string | null; city?: string | null; years_experience?: number; is_verified?: boolean; rating_avg?: number; rating_count?: number } | null }).professional;
            return (
            <Card key={a.id}>
              <Row gap={8} wrap>
                <Text style={[ui.bodyStrong, { flex: 1 }]}>{professional?.full_name ?? (lang === "ar" ? "متقدم" : "Applicant")}</Text>
                {professional?.is_verified ? <ShieldCheck size={18} /> : null}
                <Badge label={applicationStatusLabel(a.status, lang)} tone="primary" />
              </Row>
              <Text style={ui.muted}>{[professional?.headline, professional?.city, professional?.years_experience != null ? `${professional.years_experience} ${t("yearsShort")}` : null].filter(Boolean).join(" · ")}</Text>
              {(professional?.rating_count ?? 0) > 0 ? <Text style={ui.muted}>★ {Number(professional?.rating_avg ?? 0).toFixed(1)} ({professional?.rating_count})</Text> : null}
              <Text style={ui.muted}>{formatDate(a.created_at, lang)}</Text>
              {a.cover_letter ? <Text style={ui.muted}>{a.cover_letter}</Text> : null}
              <Text style={ui.label}>{t("applicantDecision")}</Text>
              <Row gap={6} wrap>
                {STAGES.map((s) => (
                  <View key={s}>
                    <Button
                      label={applicationStatusLabel(s, lang)}
                      variant={a.status === s ? "primary" : "secondary"}
                      small
                      loading={setStage.isPending && changingId === a.id}
                      disabled={a.status === s || (setStage.isPending && changingId !== a.id)}
                      onPress={() => changeStage(a.id, s)}
                    />
                  </View>
                ))}
              </Row>
              <Row gap={8}><View style={{ flex: 1 }}><Button label={t("scheduleInterview")} variant="secondary" small onPress={() => setInterviewingId(a.id)} /></View><View style={{ flex: 1 }}><Button label={t("hire")} small loading={hire.isPending} onPress={() => Alert.alert(t("hireConfirm"), t("actionCannotUndo"), [{ text: t("cancel"), style: "cancel" }, { text: t("hire"), onPress: () => hire.mutate(a.id) }])} /></View></Row>
              {interviewingId === a.id ? <View style={{ gap: 8, paddingTop: 8 }}><Field label={t("interviewTime")} value={scheduledAt} onChangeText={setScheduledAt} placeholder="2026-09-22T10:00:00+03:00" required /><Field label={t("meetingLink")} value={meetingUrl} onChangeText={setMeetingUrl} keyboardType="url" /><Row gap={8}><View style={{ flex: 1 }}><Button label={t("submit")} small loading={schedule.isPending} onPress={() => schedule.mutate({ applicationId: a.id, scheduledAt, mode: "video", meetingUrl }, { onSuccess: () => { setInterviewingId(null); setScheduledAt(""); setMeetingUrl(""); } })} /></View><View style={{ flex: 1 }}><Button label={t("cancel")} variant="ghost" small onPress={() => setInterviewingId(null)} /></View></Row></View> : null}
            </Card>
          );})
        )}

        <Title sub={t("candidatesMatchSub")}>{t("candidatesMatch")}</Title>
        {suggested.isPending ? <Loading rows={2} /> : suggested.isError ? (
          <ErrorState message={userMessage(suggested.error, lang)} onRetry={() => void suggested.refetch()} />
        ) : (suggested.data ?? []).length === 0 ? (
          <EmptyState icon={UserRound} text={lang === "ar" ? "لا توجد مطابقات جديدة حالياً." : "No new matches right now."} desc={t("candidatesMatchSub")} />
        ) : (suggested.data ?? []).map((candidate) => (
          <Card key={candidate.id}>
            <Row gap={10}>
              <View style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}><UserRound size={22} /></View>
              <View style={{ flex: 1 }}><Text style={ui.bodyStrong}>{lang === "ar" ? "مرشح مطابق" : "Matching candidate"}</Text><Text style={ui.muted}>{candidate.city} · {candidate.years_experience} {t("yearsShort")}</Text></View>
              {candidate.is_verified ? <ShieldCheck size={20} /> : null}
            </Row>
            <Button label={t("invite")} variant="secondary" small loading={invite.isPending} onPress={() => Alert.alert(t("confirmAction"), t("actionCannotUndo"), [{ text: t("cancel"), style: "cancel" }, { text: t("invite"), onPress: () => invite.mutate(candidate.id) }])} />
          </Card>
        ))}
      </Screen>
    </>
  );
}
