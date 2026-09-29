import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Check, ChevronDown, Search } from "lucide-react-native";
import { Badge, Button, Field, KeyValue, Row, ScreenHeader, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { Sheet } from "@/components/sheet";

export function ChoiceField<T extends string>({ label, value, options, onChange, inline = false }: {
  label: string; value: T; options: { value: T; label: string; keywords?: string }[]; onChange: (value: T) => void; inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { lang } = useI18n();
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => `${option.label} ${option.keywords ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const choices = <View style={{ gap: 4 }}>
    {filtered.length ? filtered.map((option) => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: option.value === value }} accessibilityLabel={option.label} onPress={() => { onChange(option.value); setOpen(false); setSearch(""); }} style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: option.value === value ? colors.primarySoft : pressed ? colors.surfaceMuted : colors.surface })}>
      <Text style={[ui.bodyStrong, { flex: 1, color: option.value === value ? colors.primary : colors.text }]}>{option.label}</Text>
      {option.value === value ? <Check size={19} color={colors.primary} /> : null}
    </Pressable>) : <Text style={[ui.muted, { paddingVertical: 14 }]}>{lang === "ar" ? "لا توجد نتائج مطابقة" : "No matching results"}</Text>}
  </View>;
  const list = <View style={{ gap: 8 }}>
    {options.length > 5 ? <Field label={lang === "ar" ? `ابحث عن ${label}` : `Search ${label}`} value={search} onChangeText={setSearch} /> : null}
    {inline ? <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }} keyboardShouldPersistTaps="always">{choices}</ScrollView> : choices}
  </View>;
  return <View style={{ gap: 8 }}>
    <Text style={ui.label}>{label}</Text>
    {inline ? list : <>
      <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={lang === "ar" ? "افتح قائمة الخيارات" : "Open choices"} accessibilityState={{ expanded: open, disabled: !options.length }} disabled={!options.length} onPress={() => setOpen(true)} style={({ pressed }) => ({ minHeight: 48, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, backgroundColor: pressed ? colors.surfaceMuted : colors.surface, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 })}>
        <Text style={[ui.bodyStrong, { flex: 1, color: selected ? colors.text : colors.textMuted }]}>{selected?.label ?? (lang === "ar" ? "اختر من القائمة" : "Choose from list")}</Text><ChevronDown size={20} color={colors.textMuted} />
      </Pressable>
      <Sheet visible={open} title={label} onClose={() => { setOpen(false); setSearch(""); }}>{list}</Sheet>
    </>}
  </View>;
}

export function ListingReview({ title, rows, privacyNote, busy, onBack, onConfirm, consentNode, error }: {
  title: string; rows: { label: string; value: string }[]; privacyNote: string; busy: boolean;
  onBack: () => void; onConfirm: () => void; consentNode: React.ReactNode; error?: string | null;
}) {
  const { t } = useI18n();
  return <>
    <ScreenHeader title={t("reviewPublish")} sub={title} />
    <View style={{ gap: 8 }}>{rows.map((row) => <KeyValue key={row.label} k={row.label} v={row.value || "—"} />)}</View>
    <View style={{ borderRadius: 12, backgroundColor: colors.primarySoft, padding: 14, gap: 6 }}>
      <Badge label={t("privacy")} tone="primary" />
      <Text style={ui.muted}>{privacyNote}</Text>
    </View>
    {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    <Button label={t("confirmPublish")} loading={busy} onPress={onConfirm} />
    <Button label={t("backToEdit")} variant="ghost" disabled={busy} onPress={onBack} />
    {consentNode}
  </>;
}

export function ListingField({ label, value, onChangeText, numeric, multiline, required, maxLength, error }: {
  label: string; value: string; onChangeText: (value: string) => void; numeric?: boolean; multiline?: boolean; required?: boolean; maxLength?: number; error?: string | null;
}) {
  return <Field label={label} value={value} onChangeText={onChangeText} keyboardType={numeric ? "decimal-pad" : "default"} inputMode={numeric ? "decimal" : "text"} multiline={multiline} required={required} maxLength={maxLength} error={error} returnKeyType={numeric ? "done" : multiline ? "default" : "next"} blurOnSubmit={numeric} />;
}