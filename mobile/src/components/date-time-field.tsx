import React, { useState } from "react";
import { Platform, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Button, Field, styles as ui } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type Props = { label: string; value: string; onChange: (value: string) => void; dateOnly?: boolean; minimumDate?: Date; required?: boolean };

export function DateTimeField({ label, value, onChange, dateOnly = false, minimumDate, required }: Props) {
  const { lang } = useI18n();
  const [mode, setMode] = useState<"date" | "time" | null>(null);
  const [draft, setDraft] = useState<Date | null>(null);
  const parsed = value ? new Date(dateOnly ? `${value}T12:00:00` : value) : null;
  const selected = parsed && !Number.isNaN(parsed.getTime()) ? parsed : minimumDate ?? new Date(Date.now() + 3600000);
  const pick = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed" || !date) { setMode(null); setDraft(null); return; }
    if (dateOnly) {
      const year = date.getFullYear();
      onChange(`${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
      setMode(null);
    } else if (Platform.OS === "android" && mode === "date") {
      setDraft(date);
      setMode("time");
    } else {
      const result = Platform.OS === "android" && draft ? new Date(draft) : new Date(date);
      if (Platform.OS === "android" && draft) result.setHours(date.getHours(), date.getMinutes(), 0, 0);
      onChange(result.toISOString());
      setMode(null); setDraft(null);
    }
  };
  if (Platform.OS === "web") return <Field label={label} value={value} onChangeText={onChange} placeholder={dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm:ss+03:00"} required={required} />;
  return <View style={{ gap: 8 }}><Text style={ui.label}>{label}{required ? " *" : ""}</Text><Button label={value ? (dateOnly ? formatDate(value, lang) : formatDateTime(value, lang)) : (lang === "ar" ? dateOnly ? "اختر التاريخ" : "اختر التاريخ والوقت" : dateOnly ? "Choose date" : "Choose date and time")} variant="secondary" onPress={() => setMode("date")} />{mode ? <DateTimePicker value={mode === "time" ? draft ?? selected : selected} mode={Platform.OS === "ios" && !dateOnly ? "datetime" : mode} minimumDate={mode === "date" ? minimumDate : undefined} onChange={pick} /> : null}</View>;
}
