import React from "react";
import { Text } from "react-native";
import { ChoiceField } from "@/components/listing-form";
import { useI18n } from "@/lib/i18n";
import { useLocations } from "@/lib/queries";
import { styles as ui } from "@/components/ui";

/** Persist the canonical Arabic city name used by listings and search, regardless of display language. */
export function CityChoice({ country, value, onChange, label }: {
  country: string; value: string; onChange: (city: string) => void; label: string;
}) {
  const { lang } = useI18n();
  const locations = useLocations();
  const rows = (locations.data ?? []).filter((row) => row.country === country);
  const seen = new Set<string>();
  const options = rows.filter((row) => {
    if (seen.has(row.city_ar)) return false;
    seen.add(row.city_ar);
    return true;
  }).map((row) => ({ value: row.city_ar, label: lang === "ar" ? row.city_ar : row.city_en || row.city_ar, keywords: `${row.city_ar} ${row.city_en ?? ""} ${row.region_ar} ${row.region_en ?? ""}` }));
  // Keep an existing historic city selectable until its administrator-managed record is restored.
  if (value && !seen.has(value)) options.unshift({ value, label: value, keywords: value });
  return <>
    <ChoiceField label={label} value={value} onChange={onChange} options={options} />
    {locations.isError ? <Text accessibilityRole="alert" style={ui.error}>{lang === "ar" ? "تعذّر تحميل المدن. أعد المحاولة." : "Could not load cities. Please retry."}</Text> : null}
    {!locations.isError && !locations.isPending && options.length === 0 ? <Text style={ui.muted}>{lang === "ar" ? "لا توجد مدن متاحة لهذه الدولة حالياً." : "No cities available for this country yet."}</Text> : null}
  </>;
}
