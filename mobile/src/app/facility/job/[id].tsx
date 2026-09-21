import React, { useState } from "react";
import { Alert, RefreshControl, Text, View } from "react-native";
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
  const [changingId, setChangingId] = useState<string | null>(null);

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
          (applicants.data ?? []).map((a) => (
            <Card key={a.id}>
              <Row gap={8} wrap>
                <Text style={[ui.bodyStrong, { flexShrink: 1 }]}> 
                  {formatDate(a.created_at, lang)}
                </Text>
                <Badge label={applicationStatusLabel(a.status, lang)} tone="primary" />
              </Row>
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
            </Card>
          ))
        )}
      </Screen>
    </>
  );
}
