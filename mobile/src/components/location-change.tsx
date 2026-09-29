import React, { useState } from "react";
import { Text, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Field, Loading, styles as ui } from "@/components/ui";
import { CityChoice, CountryChoice } from "@/components/location-choice";
import { Sheet } from "@/components/sheet";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";
import { colors, space } from "@/lib/theme";

type Target = "professional" | "facility";

export function EstablishedLocation({ country, city, target, facilityId }: { country: string; city: string; target: Target; facilityId?: string }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [field, setField] = useState<"country" | "city" | null>(null);
  const [next, setNext] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requests = useQuery({
    queryKey: ["mobile-location-requests", user?.id, target], enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profile_change_requests")
        .select("id,field,status,review_note,new_value,created_at")
        .eq("user_id", user?.id ?? "").eq("target", target).in("field", ["country", "city"])
        .order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
  const pending = (name: string) => requests.data?.find((r) => r.field === name && r.status === "pending");
  const open = (name: "country" | "city") => { setNext(""); setReason(""); setError(null); setField(name); };
  const submit = async () => {
    if (!field || !user?.id || !next.trim() || next === (field === "country" ? country : city)) {
      setError(lang === "ar" ? "اختر قيمة مختلفة." : "Choose a different value."); return;
    }
    setBusy(true); setError(null);
    const { error: failure } = await supabase.from("profile_change_requests").insert({
      user_id: user.id, target, facility_id: target === "facility" ? facilityId ?? null : null,
      field, old_value: field === "country" ? country : city, new_value: next.trim(), reason: reason.trim() || null,
    });
    setBusy(false);
    if (failure) { setError(failure.code === "23505" ? (lang === "ar" ? "لديك طلب قيد المراجعة لهذا الحقل." : "You already have a pending request for this field.") : userMessage(failure, lang)); return; }
    setField(null); void qc.invalidateQueries({ queryKey: ["mobile-location-requests"] });
  };
  return <View style={{ gap: space.md, borderTopWidth: 1, borderColor: colors.border, paddingTop: space.lg }}>
    <Text style={ui.bodyStrong}>{lang === "ar" ? "الموقع المعتمد" : "Registered location"}</Text>
    <Text style={ui.muted}>{lang === "ar" ? "يمكن تغيير الموقع بطلب تراجعه الإدارة؛ لا يتغير ملفك قبل الموافقة." : "Location changes are reviewed by the team before your profile is updated."}</Text>
    {requests.isPending ? <Loading rows={1} /> : requests.isError ? <Button label={lang === "ar" ? "إعادة تحميل الطلبات" : "Retry requests"} variant="ghost" onPress={() => void requests.refetch()} /> : null}
    {(["country", "city"] as const).map((name) => <View key={name} style={{ gap: 4 }}>
      <Text style={ui.label}>{name === "country" ? (lang === "ar" ? "الدولة" : "Country") : (lang === "ar" ? "المدينة" : "City")}</Text>
      <Text style={ui.body}>{name === "country" && country === "YE" ? (lang === "ar" ? "اليمن" : "Yemen") : name === "country" ? country : city}</Text>
      {pending(name) ? <Text style={ui.muted}>{lang === "ar" ? `طلب التغيير إلى ${pending(name)?.new_value} قيد المراجعة` : `Change to ${pending(name)?.new_value} pending review`}</Text> :
        <Button label={lang === "ar" ? "طلب تعديل" : "Request change"} variant="ghost" small onPress={() => open(name)} />}
      {requests.data?.find((r) => r.field === name && r.status === "rejected")?.review_note ? <Text style={ui.error}>{requests.data.find((r) => r.field === name && r.status === "rejected")?.review_note}</Text> : null}
    </View>)}
    <Sheet visible={field !== null} title={lang === "ar" ? "طلب تعديل الموقع" : "Request location change"} onClose={() => setField(null)} footer={<Button label={lang === "ar" ? "إرسال الطلب" : "Send request"} loading={busy} onPress={() => void submit()} />}>
      {field === "country" ? <CountryChoice label={lang === "ar" ? "الدولة الجديدة" : "New country"} value={next} onChange={setNext} /> : field === "city" ? <CityChoice label={lang === "ar" ? "المدينة الجديدة" : "New city"} country={country} value={next} onChange={setNext} /> : null}
      <Field label={lang === "ar" ? "سبب التعديل" : "Reason for change"} value={reason} onChangeText={setReason} multiline maxLength={500} />
      {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    </Sheet>
  </View>;
}