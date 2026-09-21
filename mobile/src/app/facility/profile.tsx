import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react-native";
import { Badge, Button, Card, ErrorState, Field, Loading, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useMyFacility } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";
import { useAuth } from "@/lib/auth";

export default function FacilityProfileScreen() {
  const { t, lang } = useI18n(); const queryClient = useQueryClient(); const facility = useMyFacility(); const { user, refreshRoles } = useAuth();
  const router = useRouter();
  const [nameAr, setNameAr] = useState(""); const [nameEn, setNameEn] = useState(""); const [type, setType] = useState(""); const [city, setCity] = useState(""); const [country, setCountry] = useState("YE"); const [website, setWebsite] = useState(""); const [description, setDescription] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  useEffect(() => { const f = facility.data; if (!f) return; setNameAr(f.name_ar); setNameEn(f.name_en ?? ""); setType(f.facility_type); setCity(f.city); setCountry(f.country); setWebsite(f.website ?? ""); setDescription(f.description ?? ""); }, [facility.data]);
  const save = async () => { const f = facility.data; if (!nameAr.trim() || !city.trim() || !country.trim() || !user?.id) return setError(t("requiredField")); setBusy(true); setError(null); setSaved(false); const payload = { name_ar: nameAr.trim(), name_en: nameEn.trim() || null, facility_type: type.trim() || "hospital", city: city.trim(), country: country.trim(), website: website.trim() || null, description: description.trim() || null }; const res = f ? await supabase.from("facilities").update(payload).eq("id", f.id) : await supabase.from("facilities").insert({ ...payload, user_id: user.id }); setBusy(false); if (res.error) return setError(userMessage(res.error, lang)); if (!f) { const claimed = await supabase.rpc("claim_facility_role"); if (claimed.error) return setError(userMessage(claimed.error, lang)); await refreshRoles(); } setSaved(true); void queryClient.invalidateQueries({ queryKey: ["my-facility"] }); };
  return <><Stack.Screen options={{ title: t("editFacility") }} /><Screen><ScreenHeader title={t("editFacility")} sub={lang === "ar" ? "حافظ على معلومات منشأتك دقيقة ومحدثة" : "Keep your facility information accurate"} />{facility.isPending ? <Loading /> : facility.isError ? <ErrorState message={userMessage(facility.error, lang)} onRetry={() => void facility.refetch()} /> : <Card>
    <Badge label={(facility.data?.is_verified ? t("verified") : lang === "ar" ? "قيد المراجعة" : "Under review")} tone={facility.data?.is_verified ? "success" : "warning"} />
    <Field label={t("facilityNameAr")} value={nameAr} onChangeText={setNameAr} />
    <Field label={t("facilityNameEn")} value={nameEn} onChangeText={setNameEn} autoCapitalize="words" />
    <Field label={t("facilityType")} value={type} onChangeText={setType} />
    <Field label={t("country")} value={country} onChangeText={setCountry} />
    <Field label={t("city")} value={city} onChangeText={setCity} />
    <Field label={t("website")} value={website} onChangeText={setWebsite} keyboardType="url" autoCapitalize="none" />
    <Field label={t("description")} value={description} onChangeText={setDescription} multiline />
    {error ? <ErrorState message={error} /> : null}{saved ? <Text style={ui.muted}>{t("savedSuccess")}</Text> : null}
    <Button label={t("save")} icon={Building2} onPress={() => void save()} loading={busy} />
    {facility.data ? <Button label={t("verificationDocuments")} variant="secondary" onPress={() => router.push({ pathname: "/verification", params: { target: "facility" } })} /> : null}
  </Card>}</Screen></>;
}