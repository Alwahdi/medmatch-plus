import { DistrictChoice } from "@/components/district-choice";
import { CityChoice } from "@/components/location-choice";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { CalendarClock, CheckCircle2 } from "lucide-react-native";
import { Button, EmptyState, ErrorState, Loading, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { ChoiceField, ListingField, ListingReview } from "@/components/listing-form";
import { DateTimeField } from "@/components/date-time-field";
import { useConsentGate } from "@/components/consent-gate";
import { useI18n } from "@/lib/i18n";
import { useCreateShift, useDistricts, useMyFacility, usePlatformFlag, useSpecialties } from "@/lib/queries";
import { userMessage } from "@/lib/errors";
import { formatDateTime, formatMoney } from "@/lib/format";

type Draft = { title: string; specialtyId: string; startsAt: string; endsAt: string; hourlyRate: string; city: string; country: string; districtId: string; notes: string };
const blank: Draft = { title: "", specialtyId: "", startsAt: "", endsAt: "", hourlyRate: "", city: "", country: "YE", districtId: "", notes: "" };
const key = "syndeocare.mobile.shift-draft";

export default function CreateShiftScreen() {
  const { t, lang } = useI18n(); const router = useRouter();
  const facility = useMyFacility(); const specialties = useSpecialties(); const create = useCreateShift(); const consent = useConsentGate("publisher_commitments");
   const [form, setForm] = useState(blank); const [reviewing, setReviewing] = useState(false); const [ready, setReady] = useState(false); const [error, setError] = useState<string | null>(null); const [showFieldErrors, setShowFieldErrors] = useState(false);
  useEffect(() => {
    void AsyncStorage.getItem(key)
      .then((saved) => {
        if (!saved) return;
        try { setForm({ ...blank, ...(JSON.parse(saved) as Partial<Draft>) }); }
        catch { void AsyncStorage.removeItem(key); }
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(key, JSON.stringify(form)); }, [form, ready]);
  useEffect(() => { const f = facility.data; if (f && ready) setForm((current) => current.city === f.city && current.country === f.country ? current : ({ ...current, city: f.city, country: f.country, districtId: "" })); }, [facility.data, ready]);
  const f = facility.data; const districts = useDistricts(form.country, form.city); const crossCity = usePlatformFlag("allow_cross_city_listings").data === true; const districtName = districts.data?.find((item) => item.id === form.districtId); const specialty = (specialties.data ?? []).find((item) => item.id === form.specialtyId); const specialtyName = lang === "ar" ? specialty?.name_ar : specialty?.name_en || specialty?.name_ar;
   const update = <K extends keyof Draft>(field: K, value: Draft[K]) => { setError(null); setForm((current) => ({ ...current, [field]: value })); };
   const validate = () => { if (form.title.trim().length < 2 || form.title.trim().length > 120 || !form.specialtyId || !form.city.trim() || form.city.trim().length > 60 || !form.startsAt || !form.endsAt || form.notes.length > 1000) return t("requiredField"); const start = new Date(form.startsAt).getTime(); const end = new Date(form.endsAt).getTime(); if (!Number.isFinite(start) || !Number.isFinite(end) || start <= Date.now() || end <= start || end - start > 86_400_000) return t("invalidTime"); const rate = Number(form.hourlyRate); if (!form.hourlyRate.trim() || !Number.isFinite(rate) || rate < 0 || rate > 1_000_000_000) return t("invalidAmount"); return null; };
  const submit = async () => { const problem = validate(); if (problem) return setError(problem); if (!(await consent.ensure()) || !f) return; create.mutate({ facilityId: f.id, title: form.title.trim(), specialtyId: form.specialtyId || null, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), hourlyRate: Number(form.hourlyRate), country: form.country || f.country, city: form.city || f.city, districtId: form.districtId || null, notes: form.notes.trim() || null }, { onSuccess: () => { void AsyncStorage.removeItem(key); setForm(blank); router.replace("/discover"); }, onError: (cause) => setError(userMessage(cause, lang)) }); };
   if (facility.isPending || specialties.isPending) return <Screen><Loading /></Screen>;
   if (facility.isError || specialties.isError) return <Screen><ErrorState message={userMessage(facility.error ?? specialties.error, lang)} onRetry={() => { void facility.refetch(); void specialties.refetch(); }} /></Screen>;
  if (!f) return <Screen><EmptyState icon={CalendarClock} text={t("completeProfile")} action={<Button label={t("completeNow")} onPress={() => router.replace("/facility/profile")} />} /></Screen>;
   if (!f.is_verified) return <Screen><EmptyState icon={CalendarClock} text={lang === "ar" ? "وثّق المنشأة قبل النشر" : "Verify your facility before publishing"} desc={userMessage("FACILITY_NOT_VERIFIED", lang)} action={<Button label={t("verificationDocuments")} onPress={() => router.replace({ pathname: "/verification", params: { target: "facility" } })} />} /></Screen>;
    return <><Stack.Screen options={{ title: t("publishShift") }} /><Screen>{reviewing ? <ListingReview title={form.title} privacyNote={t("privacyListingHint")} busy={create.isPending} error={error} onBack={() => setReviewing(false)} onConfirm={() => void submit()} consentNode={consent.node} rows={[{ label: t("shiftTitle"), value: form.title }, { label: t("specialty"), value: specialtyName ?? "—" }, { label: t("startsAt"), value: formatDateTime(form.startsAt, lang) }, { label: t("endsAt"), value: formatDateTime(form.endsAt, lang) }, { label: t("hourlyRate"), value: formatMoney(Number(form.hourlyRate), "YER", lang) }, { label: t("city"), value: form.city }, { label: lang === "ar" ? "المديرية" : "District", value: districtName ? (lang === "ar" ? districtName.name_ar : districtName.name_en) : "—" }, { label: t("notes"), value: form.notes }]} /> : <>
    <ScreenHeader title={t("publishShift")} sub={t("draftSaved")} />
      {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
      <ListingField label={t("shiftTitle")} value={form.title} onChangeText={(v) => update("title", v)} required maxLength={120} error={showFieldErrors && form.title.trim().length < 2 ? t("requiredField") : null} />
    <ChoiceField label={t("specialty")} value={form.specialtyId} onChange={(v) => update("specialtyId", v)} options={(specialties.data ?? []).map((item) => ({ value: item.id, label: lang === "ar" ? item.name_ar : item.name_en || item.name_ar, keywords: `${item.name_ar} ${item.name_en ?? ""}` }))} />
    <DateTimeField label={t("startsAt")} value={form.startsAt} onChange={(v) => update("startsAt", v)} minimumDate={new Date()} required />
    <DateTimeField label={t("endsAt")} value={form.endsAt} onChange={(v) => update("endsAt", v)} minimumDate={form.startsAt ? new Date(form.startsAt) : new Date()} required />
     <ListingField label={t("hourlyRate")} value={form.hourlyRate} onChangeText={(v) => update("hourlyRate", v)} numeric error={showFieldErrors && (!form.hourlyRate.trim() || !Number.isFinite(Number(form.hourlyRate)) || Number(form.hourlyRate) < 0) ? t("invalidAmount") : null} />
     {crossCity ? <CityChoice label={t("city")} country={form.country} value={form.city} onChange={(v) => setForm((c) => ({ ...c, city: v, districtId: "" }))} /> : <Text style={ui.muted}>{lang === "ar" ? `المدينة: ${f.city} (حسب ملف المنشأة)` : `City: ${f.city} (from facility profile)`}</Text>}
       <DistrictChoice country={form.country} city={form.city} value={form.districtId} onChange={(v) => update("districtId", v)} />
     <ListingField label={t("notes")} value={form.notes} onChangeText={(v) => update("notes", v)} multiline maxLength={1000} />
     <Button label={t("reviewPublish")} icon={CheckCircle2} onPress={() => { setShowFieldErrors(true); const problem = validate(); setError(problem); if (!problem) setReviewing(true); }} />
  </>}</Screen></>;
}