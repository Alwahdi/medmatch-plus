import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BriefcaseBusiness, CalendarClock, ChevronLeft, Clock3, MapPin, ShieldCheck } from "lucide-react-native";
import { Badge, Card, Row, styles as ui } from "@/components/ui";
import { colors, fonts, isRTL, radii, space, type as typo } from "@/lib/theme";
import { employmentTypeLabel, formatDateTime, formatMoney, formatSalaryRange, relativeTime } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import type { JobRow, ShiftRow } from "@/lib/queries";

export function JobCard({ job, lang, onPress }: { job: JobRow; lang: Lang; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={job.title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <View style={s.head}>
          <View style={[s.avatar, { backgroundColor: colors.primarySoft }]}>
            <BriefcaseBusiness size={22} color={colors.primary} strokeWidth={2.1} />
          </View>
          <View style={s.headText}>
            <Row gap={6}>
              <Text style={[s.title, { flexShrink: 1 }]} numberOfLines={2}>{job.title}</Text>
              {job.facility_verified ? <ShieldCheck size={17} color={colors.success} /> : null}
            </Row>
            <Row gap={5}>
              <MapPin size={14} color={colors.textMuted} />
              <Text style={ui.muted} numberOfLines={1}>{job.city} · {job.country}</Text>
            </Row>
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.amount} numberOfLines={1}>{formatSalaryRange(job.salary_min, job.salary_max, job.currency, lang)}</Text>
          <Badge label={employmentTypeLabel(job.employment_type, lang)} />
          <Text style={[ui.muted, s.time]} numberOfLines={1}>{relativeTime(job.created_at, lang)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function ShiftCard({ shift, lang, urgentLabel, perHour, onPress }: { shift: ShiftRow; lang: Lang; urgentLabel: string; perHour: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={shift.title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card>
        <View style={s.head}>
          <View style={[s.avatar, { backgroundColor: colors.accentSoft }]}>
            <CalendarClock size={22} color={colors.accent} strokeWidth={2.1} />
          </View>
          <View style={s.headText}>
            <Row gap={6}>
              <Text style={[s.title, { flexShrink: 1 }]} numberOfLines={2}>{shift.title}</Text>
              {shift.is_urgent ? <Badge label={urgentLabel} tone="warning" /> : null}
            </Row>
            <Row gap={5}>
              <Clock3 size={14} color={colors.textMuted} />
              <Text style={ui.muted} numberOfLines={1}>{formatDateTime(shift.starts_at, lang)}</Text>
            </Row>
          </View>
        </View>
        <View style={s.footer}>
          <Text style={s.amount} numberOfLines={1}>{formatMoney(shift.hourly_rate, shift.currency, lang)} / {perHour}</Text>
          <Row gap={5}>
            <MapPin size={14} color={colors.textMuted} />
            <Text style={ui.muted} numberOfLines={1}>{shift.city}</Text>
          </Row>
        </View>
      </Card>
    </Pressable>
  );
}

export function StatusCard({ title, when, place, note, actionLabel, onPress }: {
  title: string; when: string; place?: string | null; note?: string | null; actionLabel: string; onPress: () => void;
}) {
  return (
    <View style={s.status}>
      <Text style={s.statusTitle} numberOfLines={2}>{title}</Text>
      <Text style={s.statusWhen}>{when}</Text>
      {place ? (
        <Row gap={6}>
          <MapPin size={15} color={colors.messageOnPrimary} />
          <Text style={s.statusMeta} numberOfLines={1}>{place}</Text>
        </Row>
      ) : null}
      {note ? <Text style={s.statusMeta} numberOfLines={2}>{note}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [s.statusAction, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={s.statusActionLabel}>{actionLabel}</Text>
        <ChevronLeft size={17} color={colors.primary} style={{ transform: [{ scaleX: isRTL ? 1 : -1 }] }} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", gap: space.md },
  headText: { flex: 1, minWidth: 0, gap: space.xs },
  avatar: { width: 48, height: 48, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  title: { ...typo.cardTitle, color: colors.text, writingDirection: "auto" },
  footer: { flexDirection: "row", alignItems: "center", gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.border },
  amount: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 26, color: colors.primary, flexShrink: 1 },
  time: { marginStart: "auto" },
  status: { backgroundColor: colors.primary, borderRadius: radii.xl, padding: space.xl, gap: space.md },
  statusTitle: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 30, color: colors.primaryText },
  statusWhen: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24, color: colors.messageOnPrimary },
  statusMeta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.messageOnPrimary },
  statusAction: { minHeight: 48, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  statusActionLabel: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 24, color: colors.primary },
});
