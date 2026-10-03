import React from "react";
import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, EmptyState, ErrorState, KeyValue, Loading, Screen, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useAvatarUrl } from "@/lib/avatar";
import { userMessage } from "@/lib/errors";
import { colors, space } from "@/lib/theme";
import { MapPin, UserRound } from "lucide-react-native";

export default function PublicProfessionalProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();

  const professional = useQuery({
    queryKey: ["public-professional", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("healthcare_professionals")
        .select("user_id,full_name,headline,years_experience,country,city,bio,is_verified,avatar_url,rating_avg,rating_count,specialties(name_ar,name_en)")
        .eq("user_id", String(id))
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const p = professional.data;
  const avatarUrl = useAvatarUrl(p?.avatar_url ?? null);
  const specialty = p?.specialties as { name_ar: string; name_en: string } | null;

  return (
    <Screen>
      <Stack.Screen options={{ title: p?.full_name ?? (lang === "ar" ? "ملف المختص" : "Professional profile") }} />
      {professional.isPending ? (
        <Loading />
      ) : professional.isError ? (
        <ErrorState message={userMessage(professional.error, lang)} onRetry={() => void professional.refetch()} />
      ) : !p ? (
        <EmptyState icon={UserRound} text={lang === "ar" ? "الملف غير متاح" : "Profile unavailable"} />
      ) : (
        <>
          <Card style={{ alignItems: "center", gap: space.sm, paddingVertical: space.xl }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 84, height: 84 }} contentFit="cover" transition={150} /> : <UserRound size={38} color={colors.primary} />}
            </View>
            <Text style={[ui.bodyStrong, { fontSize: 18, textAlign: "center" }]}>{p.full_name}</Text>
            {p.headline ? <Text style={[ui.muted, { textAlign: "center", writingDirection: "auto" }]}>{p.headline}</Text> : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={ui.muted}>{[p.city, p.country].filter(Boolean).join("، ")}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {p.is_verified ? <Badge label={t("verified")} tone="success" /> : null}
              {p.rating_count > 0 ? <Badge label={`★ ${p.rating_avg.toFixed(1)} (${p.rating_count})`} tone="primary" /> : null}
            </View>
          </Card>

          <Card style={{ gap: 10, marginTop: space.md }}>
            {specialty ? <KeyValue k={lang === "ar" ? "التخصص" : "Specialty"} v={lang === "ar" ? specialty.name_ar : specialty.name_en} /> : null}
            <KeyValue k={lang === "ar" ? "سنوات الخبرة" : "Experience"} v={lang === "ar" ? `${p.years_experience} سنوات` : `${p.years_experience} years`} />
          </Card>

          {p.bio ? (
            <Card style={{ marginTop: space.md }}>
              <Text style={[ui.label, { color: colors.textMuted, marginBottom: 6 }]}>{lang === "ar" ? "نبذة" : "ABOUT"}</Text>
              <Text style={[ui.body, { writingDirection: "auto" }]}>{p.bio}</Text>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}
