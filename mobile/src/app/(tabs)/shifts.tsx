import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Badge, Card, Chip, EmptyState, ErrorState, Loading, Row, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useShiftSearch, useSpecialties, type ShiftRow } from "@/lib/queries";
import { formatDateTime, formatMoney } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors } from "@/lib/theme";

export default function ShiftsTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const specialties = useSpecialties();
  const shifts = useShiftSearch({ q: term, specialtyId });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, gap: 10 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => setTerm(q.trim())}
          returnKeyType="search"
          placeholder={t("searchShifts")}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t("searchShifts")}
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

      {shifts.isPending ? (
        <Loading />
      ) : shifts.isError ? (
        <View style={{ padding: 16 }}>
          <ErrorState message={userMessage(shifts.error, lang)} onRetry={() => void shifts.refetch()} />
        </View>
      ) : (
        <FlatList
          data={(shifts.data ?? []) as ShiftRow[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={shifts.isFetching} onRefresh={() => void shifts.refetch()} />}
          ListEmptyComponent={<EmptyState text={t("emptyShifts")} />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/shift/[id]", params: { id: item.id } })}
            >
              <Card>
                <Row gap={8} wrap>
                  <Text style={[ui.body, { fontWeight: "700", flexShrink: 1 }]}>{item.title}</Text>
                  {item.is_urgent ? <Badge label={lang === "ar" ? "عاجلة" : "Urgent"} tone="warning" /> : null}
                  {item.facility_verified ? <Badge label={t("verified")} tone="success" /> : null}
                </Row>
                <Text style={ui.muted}>
                  {item.city} · {item.country}
                </Text>
                <Text style={ui.muted}>{formatDateTime(item.starts_at, lang)}</Text>
                <Badge label={`${formatMoney(item.hourly_rate, item.currency, lang)} / ${lang === "ar" ? "ساعة" : "hr"}`} tone="primary" />
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
