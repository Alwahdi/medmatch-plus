import React from "react";
import { Text, View } from "react-native";
import { ChoiceField } from "@/components/listing-form";
import { Button, styles as ui } from "@/components/ui";
import { useDistricts } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";

export function DistrictChoice({ country, city, value, onChange }: { country: string; city: string; value: string; onChange: (id: string) => void }) {
  const { lang } = useI18n();
  const districts = useDistricts(country, city);
  return <View style={{ gap: 6 }}>
    <ChoiceField label={lang === "ar" ? "المديرية (اختياري)" : "District (optional)"} value={value} onChange={onChange} options={[{ value: "", label: lang === "ar" ? "بدون تحديد" : "Not specified" }, ...(districts.data ?? []).map((d) => ({ value: d.id, label: lang === "ar" ? d.name_ar : d.name_en }))]} />
    {districts.isError ? <><Text accessibilityRole="alert" style={ui.error}>{lang === "ar" ? "تعذّر تحميل المديريات؛ يمكنك النشر دون تحديد مديرية." : "Districts could not be loaded; you may publish without one."}</Text><Button label={lang === "ar" ? "إعادة المحاولة" : "Retry"} variant="ghost" onPress={() => void districts.refetch()} /></> : null}
  </View>;
}