import React, { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, ErrorState, Field, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useProfessionalProfile, useSpecialties } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { userMessage } from "@/lib/errors";
import { ChoiceField } from "@/components/listing-form";
import { colors } from "@/lib/theme";

export default function ProfileScreen() {
  const { t, lang } = useI18n();
  const { user, refreshRoles } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const profile = useProfessionalProfile();
  const specialties = useSpecialties();

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [years, setYears] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseCountry, setLicenseCountry] = useState("YE");
  const [preferredRate, setPreferredRate] = useState("");
  const [openToShifts, setOpenToShifts] = useState(false);
  const [searchable, setSearchable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = profile.data as
      | { full_name?: string; headline?: string | null; bio?: string | null; city?: string | null; years_experience?: number | null; specialty_id?: string | null; license_number?: string | null; license_country?: string | null; preferred_rate?: number | null; is_open_to_shifts?: boolean; is_searchable?: boolean }
      | null
      | undefined;
    if (!p) return;
    setFullName(p.full_name ?? "");
    setHeadline(p.headline ?? "");
    setBio(p.bio ?? "");
    setCity(p.city ?? "");
    setYears(p.years_experience != null ? String(p.years_experience) : "");
    setSpecialtyId(p.specialty_id ?? "");
    setLicenseNumber(p.license_number ?? "");
    setLicenseCountry(p.license_country ?? "YE");
    setPreferredRate(p.preferred_rate != null ? String(p.preferred_rate) : "");
    setOpenToShifts(Boolean(p.is_open_to_shifts));
    setSearchable(Boolean(p.is_searchable));
  }, [profile.data]);

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    const parsedYears = Number.parseInt(years, 10);
    const payload = {
        full_name: fullName.trim(),
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        years_experience: Number.isFinite(parsedYears) ? parsedYears : 0,
        specialty_id: specialtyId || null,
        license_number: licenseNumber.trim() || null,
        license_country: licenseCountry.trim() || null,
        preferred_rate: Number(preferredRate) || null,
        is_open_to_shifts: openToShifts,
        is_searchable: searchable,
      };
    const existing = profile.data;
    const result = existing
      ? await supabase.from("healthcare_professionals").update(payload).eq("user_id", user?.id ?? "")
      : await supabase.from("healthcare_professionals").insert({ ...payload, user_id: user?.id ?? "" });
    const err = result.error;
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      return;
    }
    setSaved(true);
    if (!existing) {
      const claimed = await supabase.rpc("claim_professional_role");
      if (claimed.error) { setError(userMessage(claimed.error, lang)); return; }
      await refreshRoles();
    }
    void qc.invalidateQueries({ queryKey: ["professional-profile"] });
    const returnTo = typeof params.returnTo === "string" && params.returnTo.startsWith("/") && !params.returnTo.startsWith("//") ? params.returnTo : null;
    if (returnTo) router.replace(returnTo as never);
  };

  return (
    <>
      <Stack.Screen options={{ title: t("profile") }} />
      <Screen>
        <Title>{t("profile")}</Title>
        {profile.isPending ? (
          <Loading />
        ) : profile.isError ? (
          <ErrorState message={userMessage(profile.error, lang)} onRetry={() => void profile.refetch()} />
        ) : (
          <Card style={{ gap: 12 }}>
            <Row gap={8} wrap>
              {(profile.data as { is_verified?: boolean } | null)?.is_verified ? (
                <Badge label={t("verified")} tone="success" />
              ) : null}
            </Row>
            <Field label={t("fullName")} value={fullName} onChangeText={setFullName} />
            <Field label={lang === "ar" ? "المسمى المهني" : "Headline"} value={headline} onChangeText={setHeadline} />
            <ChoiceField label={t("specialty")} value={specialtyId} onChange={setSpecialtyId} options={(specialties.data ?? []).slice(0, 12).map((item) => ({ value: item.id, label: lang === "ar" ? item.name_ar : item.name_en || item.name_ar }))} />
            <Field label={t("experience")} value={years} onChangeText={setYears} keyboardType="number-pad" />
            <Field label={lang === "ar" ? "المدينة" : "City"} value={city} onChangeText={setCity} />
            <Field label={lang === "ar" ? "رقم ترخيص المزاولة" : "Practice license number"} value={licenseNumber} onChangeText={setLicenseNumber} />
            <Field label={lang === "ar" ? "دولة الترخيص" : "License country"} value={licenseCountry} onChangeText={setLicenseCountry} />
            <Field label={lang === "ar" ? "الأجر المفضل" : "Preferred rate"} value={preferredRate} onChangeText={setPreferredRate} keyboardType="numeric" />
            <Field label={lang === "ar" ? "نبذة" : "Bio"} value={bio} onChangeText={setBio} multiline />
            <View style={{ gap: 10 }}>
              <View style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ flex: 1 }}><Text style={ui.bodyStrong}>{lang === "ar" ? "متاح للمناوبات" : "Available for shifts"}</Text><Text style={ui.muted}>{lang === "ar" ? "اظهر توفرّك للمناوبات المطابقة" : "Show availability for matching shifts"}</Text></View><Switch value={openToShifts} onValueChange={setOpenToShifts} trackColor={{ true: colors.primary }} /></View>
              <View style={{ minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ flex: 1 }}><Text style={ui.bodyStrong}>{lang === "ar" ? "الظهور في بحث المنشآت" : "Visible in facility search"}</Text><Text style={ui.muted}>{lang === "ar" ? "تظهر بيانات مهنية محدودة وفق الخصوصية" : "Only limited professional details appear"}</Text></View><Switch value={searchable} onValueChange={setSearchable} trackColor={{ true: colors.primary }} /></View>
            </View>
            {error ? <Text style={ui.error}>{error}</Text> : null}
            {saved ? <Text style={ui.muted}>{lang === "ar" ? "تم الحفظ." : "Saved."}</Text> : null}
            <View>
              <Button label={t("save")} onPress={save} loading={busy} disabled={!fullName.trim()} />
            </View>
            {profile.data ? <Button label={t("verificationDocuments")} variant="secondary" onPress={() => router.push({ pathname: "/verification", params: { target: "professional" } })} /> : null}
          </Card>
        )}
      </Screen>
    </>
  );
}
