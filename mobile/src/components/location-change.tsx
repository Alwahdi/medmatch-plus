import React, { useState } from "react";
import { Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Field, Loading, styles as ui } from "@/components/ui";
import { CityChoice, CountryChoice } from "@/components/location-choice";
import { ChoiceField } from "@/components/listing-form";
import { Sheet } from "@/components/sheet";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";
import { colors, space } from "@/lib/theme";

type Target = "professional" | "facility";

export function EstablishedLocation({ country, city, target, facilityId, specialtyId, specialties = [] }: { country: string; city: string; target: Target; facilityId?: string; specialtyId?: string; specialties?: { id: string; name_ar: string; name_en: string | null }[] }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [field, setField] = useState<"country" | "city" | "specialty_id" | null>(null);
  const [next, setNext] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requests = useQuery({
    queryKey: ["mobile-location-requests", user?.id, target], enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profile_change_requests")
        .select("id,field,status,review_note,new_value,created_at")
        .eq("user_id", user?.id ?? "").eq("target", target).in("field", target === "professional" ? ["country", "city", "specialty_id"] : ["country", "city"])
        .order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
  const pending = (name: string) => requests.data?.find((r) => r.field === name && r.status === "pending");
  const open = (name: "country" | "city" | "specialty_id") => { setNext(""); setReason(""); setError(null); setField(name); };
  const submit = async () => {
    if (!field || !user?.id || !next.trim() || next === (field === "country" ? country : field === "city" ? city : specialtyId) || (field === "specialty_id" && !specialties.some((s) => s.id === next))) {
      setError(lang === "ar" ? "اختر قيمة مختلفة." : "Choose a different value."); return;
    }
    setBusy(true); setError(null);
    const { error: failure } = await supabase.from("profile_change_requests").insert({
      user_id: user.id, target, facility_id: target === "facility" ? facilityId ?? null : null,
      field, old_value: field === "country" ? country : field === "city" ? city : specialtyId ?? null, new_value: next.trim(), reason: reason.trim() || null,
    });
    setBusy(false);
    if (failure) { setError(failure.code === "23505" ? (lang === "ar" ? "لديك طلب قيد المراجعة لهذا الحقل." : "You already have a pending request for this field.") : userMessage(failure, lang)); return; }
    setField(null); void qc.invalidateQueries({ queryKey: ["mobile-location-requests"] });
  };
  return <View style={{ gap: space.md, borderTopWidth: 1, borderColor: colors.border, paddingTop: space.lg }}>
    <Text style={ui.bodyStrong}>{lang === "ar" ? (specialtyId ? "البيانات المهنية المعتمدة" : "الموقع المعتمد") : (specialtyId ? "Registered professional details" : "Registered location")}</Text>
    <Text style={ui.muted}>{lang === "ar" ? "التعديلات على هذه البيانات تمر بمراجعة الإدارة؛ لا يتغير ملفك قبل الموافقة." : "Changes to these details require review before your profile is updated."}</Text>
    {requests.isPending ? <Loading rows={1} /> : requests.isError ? <Button label={lang === "ar" ? "إعادة تحميل الطلبات" : "Retry requests"} variant="ghost" onPress={() => void requests.refetch()} /> : null}
    {([...(specialtyId ? ["specialty_id" as const] : []), "country" as const, "city" as const]).map((name) => <View key={name} style={{ gap: 4 }}>
      <Text style={ui.label}>{name === "specialty_id" ? (lang === "ar" ? "التخصص" : "Specialty") : name === "country" ? (lang === "ar" ? "الدولة" : "Country") : (lang === "ar" ? "المدينة" : "City")}</Text>
      <Text style={ui.body}>{name === "specialty_id" ? (specialties.find((s) => s.id === specialtyId)?.[lang === "ar" ? "name_ar" : "name_en"] || specialties.find((s) => s.id === specialtyId)?.name_ar || "—") : name === "country" && country === "YE" ? (lang === "ar" ? "اليمن" : "Yemen") : name === "country" ? country : city}</Text>
      {pending(name) ? <Text style={ui.muted}>{lang === "ar" ? `طلب التغيير إلى ${name === "specialty_id" ? (specialties.find((s) => s.id === pending(name)?.new_value)?.name_ar ?? "—") : pending(name)?.new_value} قيد المراجعة` : `Change to ${name === "specialty_id" ? (specialties.find((s) => s.id === pending(name)?.new_value)?.name_en || specialties.find((s) => s.id === pending(name)?.new_value)?.name_ar || "—") : pending(name)?.new_value} pending review`}</Text> :
        <Button label={lang === "ar" ? "طلب تعديل" : "Request change"} variant="ghost" small disabled={requests.isPending || requests.isError} onPress={() => open(name)} />}
      {requests.data?.find((r) => r.field === name && r.status === "rejected")?.review_note ? <Text style={ui.error}>{requests.data.find((r) => r.field === name && r.status === "rejected")?.review_note}</Text> : null}
    </View>)}
    <Sheet visible={field !== null} title={lang === "ar" ? (field === "specialty_id" ? "طلب تعديل التخصص" : "طلب تعديل الموقع") : (field === "specialty_id" ? "Request specialty change" : "Request location change")} onClose={() => { if (!busy) setField(null); }} footer={<Button label={lang === "ar" ? "إرسال الطلب" : "Send request"} loading={busy} disabled={!next || requests.isPending || requests.isError} onPress={() => void submit()} />}>
      {field === "country" ? <CountryChoice label={lang === "ar" ? "الدولة الجديدة" : "New country"} value={next} onChange={setNext} /> : field === "city" ? <CityChoice label={lang === "ar" ? "المدينة الجديدة" : "New city"} country={country} value={next} onChange={setNext} /> : field === "specialty_id" ? <ChoiceField label={lang === "ar" ? "التخصص الجديد" : "New specialty"} value={next} onChange={setNext} inline options={specialties.map((s) => ({ value: s.id, label: (lang === "ar" ? s.name_ar : s.name_en) || s.name_ar, keywords: `${s.name_ar} ${s.name_en ?? ""}` }))} /> : null}
      <Field label={lang === "ar" ? "سبب التعديل" : "Reason for change"} value={reason} onChangeText={setReason} multiline maxLength={500} />
      {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    </Sheet>
  </View>;
}