import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { CalendarClock, CheckCircle2 } from "lucide-react-native";
import { Button, EmptyState, ErrorState, Loading, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { ChoiceField, ListingField, ListingReview } from "@/components/listing-form";
import { DateTimeField } from "@/components/date-time-field";
import { useConsentGate } from "@/components/consent-gate";
import { useI18n } from "@/lib/i18n";
import { useCreateShift, useMyFacility, useSpecialties } from "@/lib/queries";
import { userMessage } from "@/lib/errors";

type Draft = { title: string; specialtyId: string; startsAt: string; endsAt: string; hourlyRate: string; city: string; country: string; notes: string };
const blank: Draft = { title: "", specialtyId: "", startsAt: "", endsAt: "", hourlyRate: "", city: "", country: "YE", notes: "" };
const key = "syndeocare.mobile.shift-draft";

export default function CreateShiftScreen() {
  const { t, lang } = useI18n(); const router = useRouter();
  const facility = useMyFacility(); const specialties = useSpecialties(); const create = useCreateShift(); const consent = useConsentGate("publisher_commitments");
  const [form, setForm] = useState(blank); const [reviewing, setReviewing] = useState(false); const [ready, setReady] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { void AsyncStorage.getItem(key).then((saved) => { if (saved) setForm({ ...blank, ...(JSON.parse(saved) as Partial<Draft>) }); setReady(true); }); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(key, JSON.stringify(form)); }, [form, ready]);
  useEffect(() => { const f = facility.data; if (f && ready && !form.city) setForm((current) => ({ ...current, city: f.city, country: f.country })); }, [facility.data, ready]);
  const f = facility.data; const specialty = (specialties.data ?? []).find((item) => item.id === form.specialtyId); const specialtyName = lang === "ar" ? specialty?.name_ar : specialty?.name_en || specialty?.name_ar;
  const update = <K extends keyof Draft>(field: K, value: Draft[K]) => setForm((current) => ({ ...current, [field]: value }));
  const validate = () => { if (form.title.trim().length < 3 || !form.city.trim() || !form.startsAt || !form.endsAt) return t("requiredField"); const start = new Date(form.startsAt).getTime(); const end = new Date(form.endsAt).getTime(); if (!Number.isFinite(start) || !Number.isFinite(end) || start <= Date.now() || end <= start || end - start > 86_400_000) return t("invalidTime"); if (!(Number(form.hourlyRate) > 0)) return t("invalidAmount"); return null; };
  const submit = async () => { const problem = validate(); if (problem) return setError(problem); if (!(await consent.ensure()) || !f) return; create.mutate({ facilityId: f.id, title: form.title.trim(), specialtyId: form.specialtyId || null, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), hourlyRate: Number(form.hourlyRate), country: form.country, city: form.city.trim(), notes: form.notes.trim() || null }, { onSuccess: () => { void AsyncStorage.removeItem(key); setForm(blank); router.replace("/discover"); }, onError: (cause) => setError(userMessage(cause, lang)) }); };
   if (facility.isPending || specialties.isPending) return <Screen><Loading /></Screen>;
   if (facility.isError || specialties.isError) return <Screen><ErrorState message={userMessage(facility.error ?? specialties.error, lang)} onRetry={() => { void facility.refetch(); void specialties.refetch(); }} /></Screen>;
  if (!f) return <Screen><EmptyState icon={CalendarClock} text={t("completeProfile")} action={<Button label={t("completeNow")} onPress={() => router.replace("/facility/profile")} />} /></Screen>;
  return <><Stack.Screen options={{ title: t("publishShift") }} /><Screen>{reviewing ? <ListingReview title={form.title} privacyNote={t("privacyListingHint")} busy={create.isPending} onBack={() => setReviewing(false)} onConfirm={() => void submit()} consentNode={consent.node} rows={[{ label: t("shiftTitle"), value: form.title }, { label: t("specialty"), value: specialtyName ?? "—" }, { label: t("startsAt"), value: form.startsAt }, { label: t("endsAt"), value: form.endsAt }, { label: t("hourlyRate"), value: `${form.hourlyRate} YER` }, { label: t("city"), value: form.city }, { label: t("notes"), value: form.notes }]} /> : <>
    <ScreenHeader title={t("publishShift")} sub={t("draftSaved")} />
    <ListingField label={t("shiftTitle")} value={form.title} onChangeText={(v) => update("title", v)} />
    <ChoiceField label={t("specialty")} value={form.specialtyId} onChange={(v) => update("specialtyId", v)} options={(specialties.data ?? []).map((item) => ({ value: item.id, label: lang === "ar" ? item.name_ar : item.name_en || item.name_ar }))} />
    <DateTimeField label={t("startsAt")} value={form.startsAt} onChange={(v) => update("startsAt", v)} minimumDate={new Date()} required />
    <DateTimeField label={t("endsAt")} value={form.endsAt} onChange={(v) => update("endsAt", v)} minimumDate={form.startsAt ? new Date(form.startsAt) : new Date()} required />
    <ListingField label={t("hourlyRate")} value={form.hourlyRate} onChangeText={(v) => update("hourlyRate", v)} numeric />
    <ListingField label={t("city")} value={form.city} onChangeText={(v) => update("city", v)} />
    <ListingField label={t("notes")} value={form.notes} onChangeText={(v) => update("notes", v)} multiline />
    {error ? <ErrorState message={error} /> : null}<Button label={t("reviewPublish")} icon={CheckCircle2} onPress={() => { const problem = validate(); setError(problem); if (!problem) setReviewing(true); }} />
  </>}</Screen></>;
}