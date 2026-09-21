import React, { useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Badge, Card, Chip, EmptyState, ErrorState, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useFacilityJobs, useFacilityShifts, useMyFacility } from "@/lib/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { BriefcaseBusiness, CalendarClock, ShieldCheck, UsersRound } from "lucide-react-native";
import { colors, radii } from "@/lib/theme";

export default function FacilityHome() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const facility = useMyFacility();
  const facilityId = (facility.data as { id?: string } | null)?.id;
  const jobs = useFacilityJobs(facilityId);
  const shifts = useFacilityShifts(facilityId);
  const [tab, setTab] = useState<"jobs" | "shifts">("jobs");

  return (
    <>
      <Stack.Screen options={{ title: t("facilityWorkspace") }} />
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
        <Title sub={(facility.data as { name?: string } | null)?.name ?? ""}>{t("facilityWorkspace")}</Title>

        {facility.isPending ? (
          <Loading />
        ) : !facility.data ? (
          <EmptyState text={t("unavailableOnMobile")} />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Card style={{ flex: 1 }}><View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}><BriefcaseBusiness size={20} color={colors.primary}/></View><Text style={ui.title}>{jobs.data?.length ?? 0}</Text><Text style={ui.muted}>{t("jobs")}</Text></Card>
              <Card style={{ flex: 1 }}><View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}><CalendarClock size={20} color={colors.accent}/></View><Text style={ui.title}>{shifts.data?.length ?? 0}</Text><Text style={ui.muted}>{t("shifts")}</Text></Card>
            </View>
            <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}><Row gap={10}><ShieldCheck size={22} color={colors.primary}/><View style={{ flex: 1 }}><Text style={ui.bodyStrong}>{(facility.data as { is_verified?: boolean }).is_verified ? t("verified") : (lang === "ar" ? "التوثيق قيد المراجعة" : "Verification under review")}</Text><Text style={ui.muted}>{lang === "ar" ? "تظهر الشارة فقط بعد اعتماد المنشأة." : "The badge appears only after approval."}</Text></View></Row></Card>
            <Row gap={8}>
              <Chip label={t("jobs")} active={tab === "jobs"} onPress={() => setTab("jobs")} />
              <Chip label={t("shifts")} active={tab === "shifts"} onPress={() => setTab("shifts")} />
            </Row>

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

            <Card>
              <Text style={ui.muted}>{t("unavailableOnMobile")}</Text>
            </Card>
          </>
        )}
      </Screen>
    </>
  );
}
