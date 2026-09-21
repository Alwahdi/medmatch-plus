import React from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, Chip, Field, KeyValue, Row, ScreenHeader, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

export function ChoiceField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void;
}) {
  return <View style={{ gap: 8 }}><Text style={ui.label}>{label}</Text><Row gap={8} wrap>{options.map((option) => <Chip key={option.value} label={option.label} active={option.value === value} onPress={() => onChange(option.value)} />)}</Row></View>;
}

export function ListingReview({ title, rows, privacyNote, busy, onBack, onConfirm, consentNode }: {
  title: string; rows: { label: string; value: string }[]; privacyNote: string; busy: boolean;
  onBack: () => void; onConfirm: () => void; consentNode: React.ReactNode;
}) {
  const { t } = useI18n();
  return <>
    <ScreenHeader title={t("reviewPublish")} sub={title} />
    <Card>{rows.map((row) => <KeyValue key={row.label} k={row.label} v={row.value || "—"} />)}</Card>
    <View style={{ borderRadius: 12, backgroundColor: colors.primarySoft, padding: 14, gap: 6 }}>
      <Badge label={t("privacy")} tone="primary" />
      <Text style={ui.muted}>{privacyNote}</Text>
    </View>
    <Button label={t("confirmPublish")} loading={busy} onPress={onConfirm} />
    <Button label={t("backToEdit")} variant="ghost" disabled={busy} onPress={onBack} />
    {consentNode}
  </>;
}

export function ListingField({ label, value, onChangeText, numeric, multiline }: {
  label: string; value: string; onChangeText: (value: string) => void; numeric?: boolean; multiline?: boolean;
}) {
  return <Field label={label} value={value} onChangeText={onChangeText} keyboardType={numeric ? "numeric" : "default"} multiline={multiline} />;
}