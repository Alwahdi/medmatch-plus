import React, { useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, CalendarClock, SlidersHorizontal, Search } from "lucide-react-native";
import { Button, Chip, EmptyState, ErrorState, Field, Loading, Row, Segmented, styles as ui } from "@/components/ui";
import { Sheet } from "@/components/sheet";
import { JobCard, ShiftCard } from "@/components/cards";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { useJobSearch, useShiftSearch, useSpecialties, type JobRow, type ShiftRow } from "@/lib/queries";
import { userMessage } from "@/lib/errors";
import { colors, radii } from "@/lib/theme";

type Mode = "jobs" | "shifts";

export default function DiscoverTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("jobs");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [cityDraft, setCityDraft] = useState("");
  const [specialtyDraft, setSpecialtyDraft] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const specialties = useSpecialties();
  const jobs = useJobSearch({ q: term, specialtyId, city: city || null });
  const shifts = useShiftSearch({ q: term, specialtyId, city: city || null });
  const active = mode === "jobs" ? jobs : shifts;
  const filterCount = (specialtyId ? 1 : 0) + (city ? 1 : 0);

  const data = useMemo(
    () => (mode === "jobs" ? ((jobs.data ?? []) as JobRow[]) : ((shifts.data ?? []) as ShiftRow[])),
    [mode, jobs.data, shifts.data],
  );

  const openSheet = () => {
    setSpecialtyDraft(specialtyId);
    setCityDraft(city);
    setSheetOpen(true);
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 10, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Brand compact />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={ui.title}>{t("discover")}</Text>
            <Text style={ui.muted}>{lang === "ar" ? "وظائف ومناوبات تناسب مسارك" : "Jobs and shifts that fit you"}</Text>
          </View>
        </View>

        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: "jobs", label: t("jobs") },
            { value: "shifts", label: t("shifts") },
          ]}
        />

        <Row gap={9}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 9, minHeight: 52, paddingHorizontal: 14, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Search size={20} color={colors.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              onSubmitEditing={() => setTerm(q.trim())}
              returnKeyType="search"
              placeholder={mode === "jobs" ? t("search") : t("searchShifts")}
              placeholderTextColor={colors.textSubtle}
              accessibilityLabel={t("search")}
              style={[ui.input, { flex: 1, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0 }]}
            />
          </View>
          <View>
            <Button label={filterCount ? `${t("filters")} (${filterCount})` : t("filters")} variant="secondary" small icon={SlidersHorizontal} onPress={openSheet} />
          </View>
        </Row>
      </View>

      {active.isPending ? (
        <Loading rows={4} />
      ) : active.isError ? (
        <View style={{ padding: 18 }}>
          <ErrorState message={userMessage(active.error, lang)} onRetry={() => void active.refetch()} />
        </View>
      ) : (
        <FlatList
          data={data as (JobRow | ShiftRow)[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={active.isFetching} onRefresh={() => void active.refetch()} tintColor={colors.primary} />}
          ListHeaderComponent={
            data.length ? <Text style={ui.muted}>{t("resultsCount").replace("{n}", String(data.length))}</Text> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={mode === "jobs" ? BriefcaseBusiness : CalendarClock}
              text={mode === "jobs" ? t("emptyJobs") : t("emptyShifts")}
              desc={mode === "jobs" ? t("emptyJobsDesc") : t("emptyShiftsDesc")}
              action={filterCount ? <Button label={t("clearFilters")} variant="secondary" small onPress={() => { setSpecialtyId(null); setCity(""); }} /> : undefined}
            />
          }
          renderItem={({ item }) =>
            mode === "jobs" ? (
              <JobCard job={item as JobRow} lang={lang} onPress={() => router.push({ pathname: "/job/[id]", params: { id: item.id } })} />
            ) : (
              <ShiftCard
                shift={item as ShiftRow}
                lang={lang}
                urgentLabel={t("urgent")}
                perHour={t("perHour")}
                onPress={() => router.push({ pathname: "/shift/[id]", params: { id: item.id } })}
              />
            )
          }
        />
      )}

      <Sheet
        visible={sheetOpen}
        title={t("filtersTitle")}
        onClose={() => setSheetOpen(false)}
        footer={
          <Row gap={8}>
            <View style={{ flex: 1 }}>
              <Button label={t("clearFilters")} variant="secondary" onPress={() => { setSpecialtyDraft(null); setCityDraft(""); }} />
            </View>
            <View style={{ flex: 2 }}>
              <Button
                label={t("applyFilters")}
                onPress={() => { setSpecialtyId(specialtyDraft); setCity(cityDraft.trim()); setSheetOpen(false); }}
              />
            </View>
          </Row>
        }
      >
        <Text style={ui.label}>{t("specialty")}</Text>
        <Row gap={8} wrap>
          <Chip label={t("all")} active={!specialtyDraft} onPress={() => setSpecialtyDraft(null)} />
          {(specialties.data ?? []).map((s) => (
            <Chip
              key={s.id}
              label={lang === "ar" ? s.name_ar : s.name_en || s.name_ar}
              active={specialtyDraft === s.id}
              onPress={() => setSpecialtyDraft(specialtyDraft === s.id ? null : s.id)}
            />
          ))}
        </Row>
        <Field label={t("city")} value={cityDraft} onChangeText={setCityDraft} returnKeyType="done" />
      </Sheet>
    </SafeAreaView>
  );
}
