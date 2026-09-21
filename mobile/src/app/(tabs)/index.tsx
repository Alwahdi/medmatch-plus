import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Badge, Card, Chip, EmptyState, ErrorState, Loading, Row, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useJobSearch, useSpecialties, type JobRow } from "@/lib/queries";
import { employmentTypeLabel, formatSalaryRange, relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors } from "@/lib/theme";

export default function JobsTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const specialties = useSpecialties();
  const jobs = useJobSearch({ q: term, specialtyId });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, gap: 10 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => setTerm(q.trim())}
          returnKeyType="search"
          placeholder={t("search")}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t("search")}
          style={ui.input}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label={t("all")} active={!specialtyId} onPress={() => setSpecialtyId(null)} />
          {(specialties.data ?? []).map((s) => (
            <Chip
              key={s.id}
              label={lang === "ar" ? s.name_ar : s.name_en || s.name_ar}
              active={specialtyId === s.id}
              onPress={() => setSpecialtyId(specialtyId === s.id ? null : s.id)}
            />
          ))}
        </ScrollView>
      </View>

      {jobs.isPending ? (
        <Loading />
      ) : jobs.isError ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={userMessage(jobs.error, lang)} onRetry={() => void jobs.refetch()} />
        </View>
      ) : (
        <FlatList
          data={(jobs.data ?? []) as JobRow[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={jobs.isFetching} onRefresh={() => void jobs.refetch()} />}
          ListEmptyComponent={<EmptyState text={t("emptyJobs")} />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/job/[id]", params: { id: item.id } })}
            >
              <Card>
                <Row gap={8} wrap>
                  <Text style={[ui.body, { fontWeight: "700", flexShrink: 1 }]}>{item.title}</Text>
                  {item.facility_verified ? <Badge label={t("verified")} tone="success" /> : null}
                </Row>
                <Text style={ui.muted}>
                  {item.city} · {item.country} · {employmentTypeLabel(item.employment_type, lang)}
                </Text>
                <Row gap={8} wrap>
                  <Badge
                    label={formatSalaryRange(item.salary_min, item.salary_max, item.currency, lang)}
                    tone="primary"
                  />
                  <Text style={ui.muted}>{relativeTime(item.created_at, lang)}</Text>
                </Row>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
