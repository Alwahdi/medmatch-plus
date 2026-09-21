import React, { useEffect, useState } from "react";
import { Switch, Text, View } from "react-native";
import { Stack } from "expo-router";
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
  const { user } = useAuth();
  const qc = useQueryClient();
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
    const { error: err } = await supabase
      .from("healthcare_professionals")
      .update({
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
      })
      .eq("user_id", user?.id ?? "");
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      return;
    }
    setSaved(true);
    void qc.invalidateQueries({ queryKey: ["professional-profile"] });
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
        ) : !profile.data ? (
          <Card>
            <Text style={ui.muted}>{t("completeProfile")}</Text>
            <Button label={t("retry")} variant="secondary" onPress={() => void profile.refetch()} />
          </Card>
        ) : (
          <Card style={{ gap: 12 }}>
            <Row gap={8} wrap>
              {(profile.data as { is_verified?: boolean }).is_verified ? (
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
          </Card>
        )}
      </Screen>
    </>
  );
}
