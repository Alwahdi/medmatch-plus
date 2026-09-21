import React, { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BriefcaseBusiness, MapPin, Search, ShieldCheck } from "lucide-react-native";
import { Badge, Card, Chip, EmptyState, ErrorState, Loading, Row, styles as ui } from "@/components/ui";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { useJobSearch, useSpecialties, type JobRow } from "@/lib/queries";
import { employmentTypeLabel, formatSalaryRange, relativeTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { colors, fonts, radii } from "@/lib/theme";

export default function JobsTab() {
  const { t, lang } = useI18n(); const router = useRouter();
  const [q, setQ] = useState(""); const [term, setTerm] = useState(""); const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const specialties = useSpecialties(); const jobs = useJobSearch({ q: term, specialtyId });
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
    <View style={{ paddingHorizontal: 18, paddingTop: 10, gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><Brand compact/><View><Text style={ui.title}>{t("jobs")}</Text><Text style={ui.muted}>{lang === "ar" ? "فرص تناسب مسارك المهني" : "Opportunities for your career"}</Text></View></View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9, minHeight: 52, paddingHorizontal: 14, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}><Search size={20} color={colors.textMuted}/><TextInput value={q} onChangeText={setQ} onSubmitEditing={() => setTerm(q.trim())} returnKeyType="search" placeholder={t("search")} placeholderTextColor={colors.textSubtle} accessibilityLabel={t("search")} style={[ui.input, { flex: 1, borderWidth: 0, backgroundColor: "transparent", paddingHorizontal: 0 }]}/></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}><Chip label={t("all")} active={!specialtyId} onPress={() => setSpecialtyId(null)}/>{(specialties.data ?? []).map((s) => <Chip key={s.id} label={lang === "ar" ? s.name_ar : s.name_en || s.name_ar} active={specialtyId === s.id} onPress={() => setSpecialtyId(specialtyId === s.id ? null : s.id)}/>)}</ScrollView>
    </View>
    {jobs.isPending ? <Loading/> : jobs.isError ? <View style={{ padding: 18 }}><ErrorState message={userMessage(jobs.error, lang)} onRetry={() => void jobs.refetch()}/></View> : <FlatList data={(jobs.data ?? []) as JobRow[]} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 110 }} refreshControl={<RefreshControl refreshing={jobs.isFetching} onRefresh={() => void jobs.refetch()}/>} ListEmptyComponent={<EmptyState text={t("emptyJobs")}/>} renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/job/[id]", params: { id: item.id } })}><Card>
      <View style={{ flexDirection: "row", gap: 12 }}><View style={{ width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}><BriefcaseBusiness size={22} color={colors.primary}/></View><View style={{ flex: 1, gap: 5 }}><Row gap={7} wrap><Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{item.title}</Text>{item.facility_verified ? <ShieldCheck size={17} color={colors.success}/> : null}</Row><Row gap={5}><MapPin size={14} color={colors.textMuted}/><Text style={ui.muted}>{item.city} · {item.country}</Text></Row></View></View>
      <Row gap={7} wrap><Badge label={employmentTypeLabel(item.employment_type, lang)}/><Badge label={formatSalaryRange(item.salary_min, item.salary_max, item.currency, lang)} tone="primary"/><Text style={[ui.muted, { marginStart: "auto" }]}>{relativeTime(item.created_at, lang)}</Text></Row>
    </Card></Pressable>} />}
  </SafeAreaView>;
}