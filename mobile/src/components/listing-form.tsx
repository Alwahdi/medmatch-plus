import React, { useState } from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, Chip, Field, KeyValue, Row, ScreenHeader, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { Sheet } from "@/components/sheet";

export function ChoiceField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { lang } = useI18n();
  const selected = options.find((option) => option.value === value);
  if (options.length > 12) return <View style={{ gap: 8 }}><Text style={ui.label}>{label}</Text><Button label={selected?.label ?? (lang === "ar" ? "اختر من القائمة" : "Choose from list")} variant="secondary" onPress={() => setOpen(true)} /><Sheet visible={open} title={label} onClose={() => setOpen(false)}><Field label={lang === "ar" ? "ابحث في الخيارات" : "Search options"} value={search} onChangeText={setSearch} /><Row gap={8} wrap>{options.filter((option) => option.label.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).map((option) => <Chip key={option.value} label={option.label} active={option.value === value} onPress={() => { onChange(option.value); setOpen(false); setSearch(""); }} />)}</Row></Sheet></View>;
  return <View style={{ gap: 8 }}><Text style={ui.label}>{label}</Text><Row gap={8} wrap>{options.map((option) => <Chip key={option.value} label={option.label} active={option.value === value} onPress={() => onChange(option.value)} />)}</Row></View>;
}

export function ListingReview({ title, rows, privacyNote, busy, onBack, onConfirm, consentNode, error }: {
  title: string; rows: { label: string; value: string }[]; privacyNote: string; busy: boolean;
  onBack: () => void; onConfirm: () => void; consentNode: React.ReactNode; error?: string | null;
}) {
  const { t } = useI18n();
  return <>
    <ScreenHeader title={t("reviewPublish")} sub={title} />
    <Card>{rows.map((row) => <KeyValue key={row.label} k={row.label} v={row.value || "—"} />)}</Card>
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

export function ListingField({ label, value, onChangeText, numeric, multiline, required, maxLength }: {
  label: string; value: string; onChangeText: (value: string) => void; numeric?: boolean; multiline?: boolean; required?: boolean; maxLength?: number;
}) {
  return <Field label={label} value={value} onChangeText={onChangeText} keyboardType={numeric ? "numeric" : "default"} multiline={multiline} required={required} maxLength={maxLength} />;
}