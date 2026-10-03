import React from "react";
import { Pressable, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, EmptyState, ErrorState, Loading, Screen, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useAvatarUrl } from "@/lib/avatar";
import { userMessage } from "@/lib/errors";
import { formatMoney, relativeTime } from "@/lib/format";
import { colors, radii, space } from "@/lib/theme";
import { Briefcase, Building2, Clock3, MapPin } from "lucide-react-native";

export default function PublicFacilityProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useI18n();
  const router = useRouter();

  const facility = useQuery({
    queryKey: ["public-facility", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("id,name_ar,name_en,facility_type,country,city,description,logo_url,is_verified,rating_avg,rating_count")
        .eq("id", String(id))
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const listings = useQuery({
    queryKey: ["public-facility-listings", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [jobsRes, shiftsRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id,title,city,salary_min,salary_max,currency,created_at")
          .eq("facility_id", String(id))
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("shifts")
          .select("id,title,city,hourly_rate,currency,starts_at")
          .eq("facility_id", String(id))
          .eq("status", "open")
          .order("starts_at", { ascending: true })
          .limit(10),
      ]);
      if (jobsRes.error) throw jobsRes.error;
      if (shiftsRes.error) throw shiftsRes.error;
      return { jobs: jobsRes.data ?? [], shifts: shiftsRes.data ?? [] };
    },
  });

  const f = facility.data;
  const name = f ? (lang === "ar" ? f.name_ar : f.name_en || f.name_ar) : "";
  const logoUrl = useAvatarUrl(f?.logo_url ?? null);

  return (
    <Screen>
      <Stack.Screen options={{ title: name || (lang === "ar" ? "ملف المنشأة" : "Facility profile") }} />
      {facility.isPending ? (
        <Loading />
      ) : facility.isError ? (
        <ErrorState message={userMessage(facility.error, lang)} onRetry={() => void facility.refetch()} />
      ) : !f ? (
        <EmptyState icon={Building2} text={lang === "ar" ? "الملف غير متاح" : "Profile unavailable"} desc={lang === "ar" ? "قد تكون هوية المنشأة مخفية حتى بدء التواصل." : "The facility identity may be hidden until contact starts."} />
      ) : (
        <>
          <Card style={{ alignItems: "center", gap: space.sm, paddingVertical: space.xl }}>
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {logoUrl ? <Image source={{ uri: logoUrl }} style={{ width: 84, height: 84 }} contentFit="cover" transition={150} /> : <Building2 size={38} color={colors.primary} />}
            </View>
            <Text style={[ui.bodyStrong, { fontSize: 18, textAlign: "center" }]}>{name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={ui.muted}>{[f.city, f.country].filter(Boolean).join("، ")}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {f.is_verified ? <Badge label={t("verified")} tone="success" /> : null}
              {f.rating_count > 0 ? <Badge label={`★ ${f.rating_avg.toFixed(1)} (${f.rating_count})`} tone="primary" /> : null}
            </View>
            {f.description ? <Text style={[ui.muted, { textAlign: "center", writingDirection: "auto" }]}>{f.description}</Text> : null}
          </Card>

          <Text style={[ui.label, { color: colors.textMuted, marginTop: space.md }]}>
            {lang === "ar" ? "الفرص المتاحة" : "OPEN OPPORTUNITIES"}
          </Text>
          {listings.isPending ? (
            <Loading rows={2} />
          ) : (listings.data?.jobs.length ?? 0) + (listings.data?.shifts.length ?? 0) === 0 ? (
            <EmptyState icon={Briefcase} text={lang === "ar" ? "لا توجد فرص منشورة حاليًا" : "No open opportunities right now"} />
          ) : (
            <>
              {listings.data!.jobs.map((job) => (
                <Pressable key={job.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })}>
                  <Card>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                      <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                        <Briefcase size={19} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text style={ui.bodyStrong} numberOfLines={1}>{job.title}</Text>
                        <Text style={ui.muted} numberOfLines={1}>
                          {job.city} · {formatMoney(job.salary_min, job.currency, lang)}–{formatMoney(job.salary_max, job.currency, lang)} · {relativeTime(job.created_at, lang)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
              {listings.data!.shifts.map((shift) => (
                <Pressable key={shift.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/shift/[id]", params: { id: shift.id } })}>
                  <Card>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                      <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
                        <Clock3 size={19} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <Text style={ui.bodyStrong} numberOfLines={1}>{shift.title}</Text>
                        <Text style={ui.muted} numberOfLines={1}>
                          {shift.city} · {formatMoney(shift.hourly_rate, shift.currency, lang)}/{lang === "ar" ? "ساعة" : "hr"}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
