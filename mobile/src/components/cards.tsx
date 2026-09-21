import React from "react";
import { Pressable, Text, View } from "react-native";
import { BriefcaseBusiness, CalendarClock, ChevronLeft, Clock3, MapPin, ShieldCheck } from "lucide-react-native";
import { Badge, Card, Row, styles as ui } from "@/components/ui";
import { colors, fonts, radii } from "@/lib/theme";
import { employmentTypeLabel, formatDateTime, formatMoney, formatSalaryRange, relativeTime } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { JobRow, ShiftRow } from "@/lib/queries";

export function JobCard({ job, lang, onPress }: { job: JobRow; lang: Lang; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={job.title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }}>
            <BriefcaseBusiness size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Row gap={7} wrap>
              <Text style={[ui.bodyStrong, { flexShrink: 1 }]} numberOfLines={2}>{job.title}</Text>
              {job.facility_verified ? <ShieldCheck size={17} color={colors.success} /> : null}
            </Row>
            <Row gap={5}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={ui.muted} numberOfLines={1}>{job.city} · {job.country}</Text>
            </Row>
          </View>
        </View>
        <Row gap={7} wrap>
          <Badge label={employmentTypeLabel(job.employment_type, lang)} />
          <Badge label={formatSalaryRange(job.salary_min, job.salary_max, job.currency, lang)} tone="primary" />
          <Text style={[ui.muted, { marginStart: "auto" }]}>{relativeTime(job.created_at, lang)}</Text>
        </Row>
      </Card>
    </Pressable>
  );
}

export function ShiftCard({ shift, lang, urgentLabel, perHour, onPress }: { shift: ShiftRow; lang: Lang; urgentLabel: string; perHour: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={shift.title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }}>
            <CalendarClock size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Row gap={7} wrap>
              <Text style={[ui.bodyStrong, { flexShrink: 1 }]} numberOfLines={2}>{shift.title}</Text>
              {shift.is_urgent ? <Badge label={urgentLabel} tone="warning" /> : null}
            </Row>
            <Row gap={5}>
              <Clock3 size={14} color={colors.textMuted} />
              <Text style={ui.muted} numberOfLines={1}>{formatDateTime(shift.starts_at, lang)}</Text>
            </Row>
          </View>
        </View>
        <Row gap={6} wrap>
          <MapPin size={14} color={colors.textMuted} />
          <Text style={ui.muted}>{shift.city} · {shift.country}</Text>
          <View style={{ marginStart: "auto" }}>
            <Badge label={`${formatMoney(shift.hourly_rate, shift.currency, lang)} / ${perHour}`} tone="primary" />
          </View>
        </Row>
      </Card>
    </Pressable>
  );
}

export function StatusCard({ title, when, place, note, actionLabel, onPress }: {
  title: string; when: string; place?: string | null; note?: string | null; actionLabel: string; onPress: () => void;
}) {
  return (
    <View style={{ backgroundColor: colors.primary, borderRadius: radii.xl, padding: 18, gap: 10 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.primaryText }} numberOfLines={2}>{title}</Text>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.messageOnPrimary }}>{when}</Text>
      {place ? (
        <Row gap={6}>
          <MapPin size={15} color={colors.messageOnPrimary} />
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.messageOnPrimary }} numberOfLines={1}>{place}</Text>
        </Row>
      ) : null}
      {note ? <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.messageOnPrimary }} numberOfLines={2}>{note}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({ minHeight: 44, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, opacity: pressed ? 0.85 : 1 })}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.primary }}>{actionLabel}</Text>
        <ChevronLeft size={17} color={colors.primary} />
      </Pressable>
    </View>
  );
}
