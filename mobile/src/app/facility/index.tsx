import React, { useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Badge, Button, Card, EmptyState, ErrorState, Loading, Row, Screen, ScreenHeader, Segmented, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useFacilityJobs, useFacilityShifts, useMyFacility } from "@/lib/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { BriefcaseBusiness, Building2, CalendarClock, FilePlus2, ShieldCheck, UsersRound } from "lucide-react-native";
import { colors, radii } from "@/lib/theme";

export default function FacilityHome({ embedded = false }: { embedded?: boolean }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const facility = useMyFacility();
  const facilityId = (facility.data as { id?: string } | null)?.id;
  const jobs = useFacilityJobs(facilityId);
  const shifts = useFacilityShifts(facilityId);
  const [tab, setTab] = useState<"jobs" | "shifts">(params.tab === "shifts" ? "shifts" : "jobs");

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
                    <Text style={ui.bodyStrong}>{documents.length === 0 ? (lang === "ar" ? "لم يتم رفع مستندات التوثيق" : "No verification documents yet") : (lang === "ar" ? "التوثيق قيد المراجعة" : "Verification under review")}</Text>
                    <Text style={ui.muted}>{documents.length === 0 ? (lang === "ar" ? "ارفع رخصة المنشأة والسجل التجاري لتفعيل التوثيق." : "Upload the facility licence and commercial registry to start verification.") : (lang === "ar" ? "تظهر الشارة فقط بعد اعتماد المنشأة." : "The badge appears only after approval.")}</Text>
                  </View>
                </Row>
                {documents.length === 0 ? (
                  <Button label={lang === "ar" ? "رفع المستندات" : "Upload documents"} small onPress={() => router.push({ pathname: "/verification", params: { target: "facility" } })} />
                ) : null}
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
                <Card key={s.id}>
                  <Row gap={8} wrap>
                    <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{s.title}</Text>
                    <Badge label={s.status} />
                  </Row>
                  <Text style={ui.muted}>{formatDateTime(s.starts_at, lang)}</Text>
                </Card>
              ))
            )}
          </>
        )}
      </Screen>
    </>
  );
}
