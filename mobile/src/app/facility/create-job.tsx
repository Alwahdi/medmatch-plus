import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { BriefcaseBusiness, CheckCircle2 } from "lucide-react-native";
import { Button, EmptyState, ErrorState, Loading, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { ChoiceField, ListingField, ListingReview } from "@/components/listing-form";
import { useConsentGate } from "@/components/consent-gate";
import { useI18n } from "@/lib/i18n";
import { useCreateJob, useMyFacility, useSpecialties } from "@/lib/queries";
import { userMessage } from "@/lib/errors";

type Employment = "full_time" | "part_time" | "contract" | "locum" | "shift";
type Draft = { title: string; description: string; specialtyId: string; employmentType: Employment; country: string; city: string; salaryMin: string; salaryMax: string; minExperience: string; vacancies: string; requiredLicense: string };
const blank: Draft = { title: "", description: "", specialtyId: "", employmentType: "full_time", country: "YE", city: "", salaryMin: "", salaryMax: "", minExperience: "0", vacancies: "1", requiredLicense: "YE" };
const key = "syndeocare.mobile.job-draft";

export default function CreateJobScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const facility = useMyFacility();
  const specialties = useSpecialties();
  const create = useCreateJob();
  const consent = useConsentGate("publisher_commitments");
  const [form, setForm] = useState(blank);
  const [reviewing, setReviewing] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void AsyncStorage.getItem(key).then((saved) => { if (saved) setForm({ ...blank, ...(JSON.parse(saved) as Partial<Draft>) }); setReady(true); }); }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(key, JSON.stringify(form)); }, [form, ready]);
  useEffect(() => { const f = facility.data; if (f && ready && !form.city) setForm((current) => ({ ...current, city: f.city, country: f.country })); }, [facility.data, ready]);

  const f = facility.data;
  const specialty = (specialties.data ?? []).find((item) => item.id === form.specialtyId);
  const specialtyName = lang === "ar" ? specialty?.name_ar : specialty?.name_en || specialty?.name_ar;
  const facilityNames = useMemo(() => [f?.name_ar, f?.name_en].filter(Boolean).map((value) => String(value).toLowerCase()), [f]);
  const hasDisclosure = (text: string) => /(?:\+?967|\b7\d{8}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|www\.)/i.test(text) || facilityNames.some((name) => name.length > 2 && text.toLowerCase().includes(name));
  const validate = () => {
    if (!form.title.trim() || form.title.trim().length < 3 || form.description.trim().length < 20 || !form.city.trim()) return t("requiredField");
    const min = Number(form.salaryMin); const max = Number(form.salaryMax);
    if (!form.salaryMin.trim() || !form.salaryMax.trim() || !Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) return t("invalidAmount");
    if (max < min) return t("salaryOrder");
    if (!Number.isInteger(Number(form.minExperience)) || Number(form.minExperience) < 0 || !Number.isInteger(Number(form.vacancies)) || Number(form.vacancies) < 1 || Number(form.vacancies) > 50) return t("invalidAmount");
    if (hasDisclosure(`${form.title} ${form.description}`)) return t("privacyListingError");
    return null;
  };
  const update = <K extends keyof Draft>(field: K, value: Draft[K]) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async () => {
    const problem = validate(); if (problem) return setError(problem);
    if (!(await consent.ensure()) || !f) return;
     create.mutate({ facilityId: f.id, title: form.title.trim(), description: form.description.trim(), specialtyId: form.specialtyId || null, employmentType: form.employmentType, country: form.country, city: form.city.trim(), salaryMin: Number(form.salaryMin), salaryMax: Number(form.salaryMax), minExperience: Number(form.minExperience), vacancies: Number(form.vacancies), requiredLicense: form.requiredLicense || null }, { onSuccess: () => { void AsyncStorage.removeItem(key); setForm(blank); router.replace("/discover"); }, onError: (cause) => setError(userMessage(cause, lang)) });
  };

   if (facility.isPending || specialties.isPending) return <Screen><Loading /></Screen>;
   if (facility.isError || specialties.isError) return <Screen><ErrorState message={userMessage(facility.error ?? specialties.error, lang)} onRetry={() => { void facility.refetch(); void specialties.refetch(); }} /></Screen>;
  if (!f) return <Screen><EmptyState icon={BriefcaseBusiness} text={t("completeProfile")} action={<Button label={t("completeNow")} onPress={() => router.replace("/facility/profile")} />} /></Screen>;
  return <><Stack.Screen options={{ title: t("publishJob") }} /><Screen>
    {reviewing ? <ListingReview title={form.title} privacyNote={t("privacyListingHint")} busy={create.isPending} error={error} onBack={() => setReviewing(false)} onConfirm={() => void submit()} consentNode={consent.node} rows={[
      { label: t("jobTitle"), value: form.title }, { label: t("specialty"), value: specialtyName ?? "—" }, { label: t("employmentType"), value: t(form.employmentType === "full_time" ? "fullTime" : form.employmentType === "part_time" ? "partTime" : form.employmentType as "contract" | "locum") }, { label: t("city"), value: form.city }, { label: t("salary"), value: `${form.salaryMin} – ${form.salaryMax} YER` }, { label: t("description"), value: form.description },
    ]} /> : <>
      <ScreenHeader title={t("publishJob")} sub={t("draftSaved")} />
      <ListingField label={t("jobTitle")} value={form.title} onChangeText={(v) => update("title", v)} />
      <ChoiceField label={t("employmentType")} value={form.employmentType} onChange={(v) => update("employmentType", v)} options={[{ value: "full_time", label: t("fullTime") }, { value: "part_time", label: t("partTime") }, { value: "contract", label: t("contract") }, { value: "locum", label: t("locum") }]} />
       <ChoiceField label={t("specialty")} value={form.specialtyId} onChange={(v) => update("specialtyId", v)} options={(specialties.data ?? []).map((item) => ({ value: item.id, label: lang === "ar" ? item.name_ar : item.name_en || item.name_ar }))} />
      <ListingField label={t("city")} value={form.city} onChangeText={(v) => update("city", v)} />
      <View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><ListingField label={t("salaryFrom")} value={form.salaryMin} onChangeText={(v) => update("salaryMin", v)} numeric /></View><View style={{ flex: 1 }}><ListingField label={t("salaryTo")} value={form.salaryMax} onChangeText={(v) => update("salaryMax", v)} numeric /></View></View>
      <View style={{ flexDirection: "row", gap: 10 }}><View style={{ flex: 1 }}><ListingField label={t("minExperience")} value={form.minExperience} onChangeText={(v) => update("minExperience", v)} numeric /></View><View style={{ flex: 1 }}><ListingField label={t("vacancies")} value={form.vacancies} onChangeText={(v) => update("vacancies", v)} numeric /></View></View>
      <ListingField label={t("description")} value={form.description} onChangeText={(v) => update("description", v)} multiline />
      <Text style={ui.muted}>{t("privacyListingHint")}</Text>{error ? <ErrorState message={error} /> : null}
      <Button label={t("reviewPublish")} icon={CheckCircle2} onPress={() => { const problem = validate(); setError(problem); if (!problem) setReviewing(true); }} />
    </>}
  </Screen></>;
}