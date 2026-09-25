import React, { useEffect, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Card, EmptyState, ErrorState, Loading, Row, Screen, ScreenHeader, Segmented, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useFacilityJobs, useFacilityShifts, useMyFacility, useVerificationDocuments } from "@/lib/queries";
import { bookingStatusLabel, formatDate, formatDateTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { Building2, CalendarClock, FilePlus2, ShieldCheck, UsersRound } from "lucide-react-native";
import { colors } from "@/lib/theme";

export default function FacilityHome({ embedded = false }: { embedded?: boolean }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const facility = useMyFacility();
  const facilityId = (facility.data as { id?: string } | null)?.id;
  const jobs = useFacilityJobs(facilityId);
  const shifts = useFacilityShifts(facilityId);
  const docs = useVerificationDocuments("facility", facilityId);
  const documents = docs.data ?? [];
  const [tab, setTab] = useState<"jobs" | "shifts">(params.tab === "shifts" ? "shifts" : "jobs");
  useEffect(() => { setTab(params.tab === "shifts" ? "shifts" : "jobs"); }, [params.tab]);


  return (
    <>
      {!embedded ? <Stack.Screen options={{ title: t("facilityWorkspace") }} /> : null}
      <Screen
        refreshControl={
          <RefreshControl
            refreshing={jobs.isFetching || shifts.isFetching}
            onRefresh={() => {
              void jobs.refetch();
              void shifts.refetch();
            }}
          />
        }
      >
        <ScreenHeader title={t("myListings")} sub={(facility.data as { name_ar?: string; name_en?: string | null } | null)?.[lang === "ar" ? "name_ar" : "name_en"] ?? (facility.data as { name_ar?: string } | null)?.name_ar ?? ""} />

        {facility.isPending ? (
          <Loading />
        ) : facility.isError ? (
          <ErrorState message={userMessage(facility.error, lang)} onRetry={() => void facility.refetch()} />
        ) : !facility.data ? (
          <EmptyState icon={Building2} text={t("completeProfile")} desc={t("nextFac1Sub")} action={<Button label={t("completeNow")} onPress={() => router.replace("/facility/profile")} />} />
        ) : (
          <>
            <Row gap={10}>
              <View style={{ flex: 1 }}><Button label={t("publishJob")} icon={FilePlus2} small onPress={() => router.push("/facility/create-job")} /></View>
              <View style={{ flex: 1 }}><Button label={t("publishShift")} variant="secondary" icon={CalendarClock} small onPress={() => router.push("/facility/create-shift")} /></View>
            </Row>
            {(facility.data as { is_verified?: boolean }).is_verified ? null : (
              <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
                <Row gap={10}>
                  <ShieldCheck size={22} color={colors.warning} />
                  <View style={{ flex: 1 }}>
                    <Text style={ui.bodyStrong}>{docs.isPending ? t("loading") : documents.some((d) => d.status === "rejected") ? t("documentRejected") : documents.some((d) => d.status === "pending") ? t("documentPending") : (lang === "ar" ? "لم يبدأ التوثيق" : "Verification not started")}</Text>
                    <Text style={ui.muted}>{documents.length === 0 ? (lang === "ar" ? "ارفع مستندات المنشأة لبدء المراجعة." : "Upload facility documents to start review.") : (lang === "ar" ? "راجع حالة كل مستند وملاحظات المراجعة." : "See each document's status and review notes.")}</Text>
                  </View>
                </Row>
                <Button label={t("verificationDocuments")} small onPress={() => router.push({ pathname: "/verification", params: { target: "facility" } })} />
              </Card>
            )}
            <Segmented value={tab} onChange={setTab} options={[{ value: "jobs", label: t("jobs"), count: jobs.data?.length }, { value: "shifts", label: t("shifts"), count: shifts.data?.length }]} />


            {tab === "jobs" ? (
              jobs.isPending ? (
                <Loading />
              ) : jobs.isError ? (
                <ErrorState message={userMessage(jobs.error, lang)} onRetry={() => void jobs.refetch()} />
              ) : (jobs.data ?? []).length === 0 ? (
                <EmptyState text={t("emptyJobs")} />
              ) : (
                (jobs.data ?? []).map((j) => (
                  <Pressable
                    key={j.id}
                    accessibilityRole="button"
                    accessibilityLabel={j.title}
                    onPress={() => router.push({ pathname: "/facility/job/[id]", params: { id: j.id } })}
                  >
                    <Card>
                      <Row gap={8} wrap>
                        <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{j.title}</Text>
                        <Badge
                          label={j.is_active ? (lang === "ar" ? "منشورة" : "Live") : lang === "ar" ? "مغلقة" : "Closed"}
                          tone={j.is_active ? "success" : "neutral"}
                        />
                      </Row>
                      <Row gap={6}><UsersRound size={15} color={colors.textMuted}/><Text style={ui.muted}>{t("applicants")}: {j.applications_count ?? 0} · {t("vacancies")}: {j.vacancies ?? 1}</Text></Row>
                      <Text style={ui.muted}>{formatDate(j.created_at, lang)}</Text>
                    </Card>
                  </Pressable>
                ))
              )
            ) : shifts.isPending ? (
              <Loading />
            ) : shifts.isError ? (
              <ErrorState message={userMessage(shifts.error, lang)} onRetry={() => void shifts.refetch()} />
            ) : (shifts.data ?? []).length === 0 ? (
              <EmptyState text={t("emptyShifts")} />
            ) : (
              (shifts.data ?? []).map((s) => (
                 <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={s.title} onPress={() => router.push({ pathname: "/facility/shift/[id]", params: { id: s.id } })}><Card>
                  <Row gap={8} wrap>
                    <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{s.title}</Text>
                     <Badge label={bookingStatusLabel(s.status, lang)} />
                  </Row>
                  <Text style={ui.muted}>{formatDateTime(s.starts_at, lang)}</Text>
                 </Card></Pressable>
              ))
            )}
          </>
        )}
      </Screen>
    </>
  );
}
