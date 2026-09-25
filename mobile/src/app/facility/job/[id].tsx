import React, { useState } from "react";
import { Alert, RefreshControl, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useHireApplicant, useInviteSuggestedCandidate, useJob, useJobApplicants, useScheduleInterview, useSetApplicationStage, useSuggestedCandidates } from "@/lib/queries";
import { applicationStatusLabel, formatDate } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { ShieldCheck, UserRound } from "lucide-react-native";
import { colors } from "@/lib/theme";
import { DateTimeField } from "@/components/date-time-field";

const STAGES = ["reviewing", "shortlisted", "interview", "rejected"] as const;

/** شرط توثيق وليس عطلاً: نعرضه كبوابة واضحة بدل رسالة خطأ. */
const verificationGated = (error: unknown) => {
  const raw = error && typeof error === "object" && "message" in error ? String((error as { message: unknown }).message) : String(error ?? "");
  return /VERIFICATION_REQUIRED|MFA_REQUIRED|not verified/i.test(raw);
};


export default function FacilityJobApplicants() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
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
  const [actionError, setActionError] = useState<string | null>(null);

  const submitInterview = (applicationId: string) => {
    const when = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      setActionError(lang === "ar" ? "اختر موعداً مستقبلياً للمقابلة." : "Choose a future interview time.");
      return;
    }
    if (meetingUrl.trim() && !/^https:\/\/[^\s]+\.[^\s]+$/i.test(meetingUrl.trim())) {
      setActionError(lang === "ar" ? "أدخل رابط اجتماع آمن يبدأ بـ https://" : "Enter a secure meeting link starting with https://");
      return;
    }
    setActionError(null);
    schedule.mutate({ applicationId, scheduledAt: when.toISOString(), mode: "video", meetingUrl: meetingUrl.trim() }, {
      onSuccess: () => { setInterviewingId(null); setScheduledAt(""); setMeetingUrl(""); },
      onError: (cause) => setActionError(userMessage(cause, lang)),
    });
  };

  const changeStage = (applicationId: string, status: typeof STAGES[number]) => {
    Alert.alert(
      t("confirmAction"),
      `${t("actionCannotUndo")}\n${applicationStatusLabel(status, lang)}`,
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("confirmAction"), style: status === "rejected" ? "destructive" : "default", onPress: () => {
          setChangingId(applicationId);
           setActionError(null);
           setStage.mutate({ id: applicationId, status }, { onError: (cause) => setActionError(userMessage(cause, lang)), onSettled: () => setChangingId(null) });
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
        {actionError ? <Text accessibilityRole="alert" style={ui.error}>{actionError}</Text> : null}

        {applicants.isPending ? (
          <Loading />
        ) : applicants.isError ? (
          <ErrorState message={userMessage(applicants.error, lang)} onRetry={() => void applicants.refetch()} />
        ) : (applicants.data ?? []).length === 0 ? (
          <EmptyState text={lang === "ar" ? "لا يوجد متقدمون بعد." : "No applicants yet."} />
        ) : (
          (applicants.data ?? []).map((a) => {
            const professional = (a as unknown as { professional?: { full_name?: string; headline?: string | null; city?: string | null; years_experience?: number; is_verified?: boolean; rating_avg?: number; rating_count?: number } | null }).professional;
            const meta = [professional?.headline, professional?.city, professional?.years_experience != null ? `${professional.years_experience} ${t("yearsShort")}` : null].filter(Boolean).join(" · ");
            return (
            <Card key={a.id}>
              <Row gap={8}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                  <UserRound size={21} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Row gap={6}>
                    <Text style={[ui.bodyStrong, { flexShrink: 1 }]} numberOfLines={1}>{professional?.full_name ?? (lang === "ar" ? "متقدم" : "Applicant")}</Text>
                    {professional?.is_verified ? <ShieldCheck size={16} color={colors.success} /> : null}
                  </Row>
                  {meta ? <Text style={ui.muted} numberOfLines={2}>{meta}</Text> : null}
                </View>
                <Badge label={applicationStatusLabel(a.status, lang)} tone="primary" />
              </Row>
              <Text style={ui.muted}>
                {(professional?.rating_count ?? 0) > 0
                  ? `${lang === "ar" ? "التقييم" : "Rating"} ${Number(professional?.rating_avg ?? 0).toFixed(1)} / 5 (${professional?.rating_count}) · `
                  : ""}
                {lang === "ar" ? "قدّم في" : "Applied on"} {formatDate(a.created_at, lang)}
              </Text>
              {a.cover_letter ? <Text style={ui.body} numberOfLines={4}>{a.cover_letter}</Text> : null}

              <View style={{ gap: 8 }}>
                <Text style={ui.label}>{t("applicantDecision")}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {STAGES.map((s) => (
                    <View key={s} style={{ flexBasis: "47%", flexGrow: 1 }}>
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
                </View>
              </View>

               <Row gap={8}><View style={{ flex: 1 }}><Button label={t("scheduleInterview")} variant="secondary" small onPress={() => { setInterviewingId(a.id); setActionError(null); }} /></View><View style={{ flex: 1 }}><Button label={t("hire")} small loading={hire.isPending} disabled={a.status === "hired" || a.status === "rejected" || a.status === "withdrawn"} onPress={() => Alert.alert(t("hireConfirm"), t("actionCannotUndo"), [{ text: t("cancel"), style: "cancel" }, { text: t("hire"), onPress: () => hire.mutate(a.id, { onError: (cause) => setActionError(userMessage(cause, lang)) }) }])} /></View></Row>
               {interviewingId === a.id ? <View style={{ gap: 8, paddingTop: 8 }}><DateTimeField label={t("interviewTime")} value={scheduledAt} onChange={setScheduledAt} minimumDate={new Date()} required /><Field label={t("meetingLink")} value={meetingUrl} onChangeText={setMeetingUrl} keyboardType="url" autoCapitalize="none" /><Row gap={8}><View style={{ flex: 1 }}><Button label={t("submit")} small loading={schedule.isPending} onPress={() => submitInterview(a.id)} /></View><View style={{ flex: 1 }}><Button label={t("cancel")} variant="ghost" small onPress={() => setInterviewingId(null)} /></View></Row></View> : null}
            </Card>
          );})
        )}

        <Title sub={t("candidatesMatchSub")}>{t("candidatesMatch")}</Title>
        {suggested.isPending ? <Loading rows={2} /> : suggested.isError ? (
          verificationGated(suggested.error) ? (
            <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
              <Row gap={10}>
                <ShieldCheck size={22} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={ui.bodyStrong}>{lang === "ar" ? "متاح بعد توثيق المنشأة" : "Available after facility verification"}</Text>
                  <Text style={ui.muted}>{lang === "ar" ? "ارفع رخصة المنشأة والسجل التجاري لعرض المرشحين المناسبين ودعوتهم." : "Upload your licence and commercial registry to see and invite matching candidates."}</Text>
                </View>
              </Row>
              <Button label={lang === "ar" ? "رفع المستندات" : "Upload documents"} small onPress={() => router.push({ pathname: "/verification", params: { target: "facility" } })} />
            </Card>
          ) : (
            <ErrorState message={userMessage(suggested.error, lang)} onRetry={() => void suggested.refetch()} />
          )
        ) : (suggested.data ?? []).length === 0 ? (
          <EmptyState icon={UserRound} text={lang === "ar" ? "لا توجد مطابقات جديدة حالياً." : "No new matches right now."} desc={t("candidatesMatchSub")} />
        ) : (suggested.data ?? []).map((candidate) => (
          <Card key={candidate.id}>
            <Row gap={10}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}><UserRound size={21} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={ui.bodyStrong}>{lang === "ar" ? "مرشح مطابق" : "Matching candidate"}</Text><Text style={ui.muted}>{[candidate.city, candidate.years_experience != null ? `${candidate.years_experience} ${t("yearsShort")}` : null].filter(Boolean).join(" · ")}</Text></View>
              {candidate.is_verified ? <ShieldCheck size={20} color={colors.success} /> : null}
            </Row>
             <Button label={t("invite")} variant="secondary" small loading={invite.isPending} onPress={() => Alert.alert(t("confirmAction"), t("actionCannotUndo"), [{ text: t("cancel"), style: "cancel" }, { text: t("invite"), onPress: () => invite.mutate(candidate.id, { onError: (cause) => setActionError(userMessage(cause, lang)) }) }])} />
          </Card>
        ))}

      </Screen>
    </>
  );
}
