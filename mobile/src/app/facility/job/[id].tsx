import React from "react";
import { RefreshControl, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Badge, Button, Card, EmptyState, ErrorState, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useJob, useJobApplicants, useSetApplicationStage } from "@/lib/queries";
import { applicationStatusLabel, formatDate } from "@/lib/format";
import { userMessage } from "@/lib/errors";

const STAGES = ["reviewing", "shortlisted", "interview", "rejected"] as const;

export default function FacilityJobApplicants() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const job = useJob(String(id));
  const applicants = useJobApplicants(String(id));
  const setStage = useSetApplicationStage(String(id));

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
          (applicants.data ?? []).map((a) => (
            <Card key={a.id}>
              <Row gap={8} wrap>
                <Text style={[ui.bodyStrong, { flexShrink: 1 }]}> 
                  {formatDate(a.created_at, lang)}
                </Text>
                <Badge label={applicationStatusLabel(a.status, lang)} tone="primary" />
              </Row>
              {a.cover_letter ? <Text style={ui.muted}>{a.cover_letter}</Text> : null}
              <Row gap={6} wrap>
                {STAGES.map((s) => (
                  <View key={s}>
                    <Button
                      label={applicationStatusLabel(s, lang)}
                      variant={a.status === s ? "primary" : "secondary"}
                      small
                      loading={setStage.isPending}
                      onPress={() => setStage.mutate({ id: a.id, status: s })}
                    />
                  </View>
                ))}
              </Row>
            </Card>
          ))
        )}

        <Card>
          <Text style={ui.muted}>{t("unavailableOnMobile")}</Text>
        </Card>
      </Screen>
    </>
  );
}
