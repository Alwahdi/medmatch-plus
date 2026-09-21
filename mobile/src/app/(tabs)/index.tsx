import React, { useMemo } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardList,
  MailOpen,
  MessageCircle,
  Star,
  UserRound,
} from "lucide-react-native";
import { Button, EmptyState, IconButton, Row, Screen, SectionHeader, StatTile, styles as ui } from "@/components/ui";
import { JobCard, ShiftCard, StatusCard } from "@/components/cards";
import { Brand } from "@/components/brand";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  useJobSearch,
  useMyApplications,
  useMyBookings,
  useMyFacility,
  useMyInvitations,
  useNotifications,
  useProfessionalProfile,
  useShiftSearch,
  type JobRow,
  type ShiftRow,
} from "@/lib/queries";
import { formatDateTime, relativeTime } from "@/lib/format";
import { colors, fonts, radii } from "@/lib/theme";

export default function HomeTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user, isFacility } = useAuth();

  const professional = useProfessionalProfile();
  const facility = useMyFacility();
  const applications = useMyApplications();
  const bookings = useMyBookings();
  const invitations = useMyInvitations();
  const notifications = useNotifications();
  const jobs = useJobSearch({ q: "" });
  const shifts = useShiftSearch({ q: "" });

  const p = professional.data as { full_name?: string } | null;
  const f = facility.data as { name?: string } | null;
  const name = (f?.name ?? p?.full_name ?? user?.email ?? "").split("@")[0] ?? "";

  const unread = (notifications.data ?? []).filter((n) => !n.read_at).length;
  const pendingInvites = (invitations.data ?? []).filter((i) => i.status === "pending").length;

  const nextBooking = useMemo(() => {
    const now = Date.now();
    return (bookings.data ?? [])
      .map((b) => ({ b, shift: (b as unknown as { shifts?: { title?: string; starts_at?: string; city?: string } }).shifts }))
      .filter((x) => x.shift?.starts_at && new Date(x.shift.starts_at).getTime() > now && x.b.status === "booked")
      .sort((a, z) => new Date(a.shift!.starts_at!).getTime() - new Date(z.shift!.starts_at!).getTime())[0];
  }, [bookings.data]);

  const refreshing =
    applications.isFetching || bookings.isFetching || invitations.isFetching || notifications.isFetching;

  const refetchAll = () => {
    void applications.refetch();
    void bookings.refetch();
    void invitations.refetch();
    void notifications.refetch();
    void jobs.refetch();
    void shifts.refetch();
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={colors.primary} />}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Brand compact />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 19, color: colors.text }} numberOfLines={1}>
            {t("helloName").replace("{name}", name || t("account"))}
          </Text>
          <Text style={ui.muted} numberOfLines={1}>{isFacility ? t("homeSubFac") : t("homeSubPro")}</Text>
        </View>
        <View>
          <IconButton icon={Bell} label={t("notifications")} onPress={() => router.push("/notifications")} />
          {unread ? (
            <View style={{ position: "absolute", top: -4, end: -4, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: radii.pill, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: colors.primaryText }}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <SectionHeader title={t("nextUp")} />
      {nextBooking?.shift ? (
        <StatusCard
          title={nextBooking.shift.title ?? "—"}
          when={`${formatDateTime(nextBooking.shift.starts_at, lang)} · ${t("startsIn").replace("{t}", relativeTime(nextBooking.shift.starts_at, lang))}`}
          place={nextBooking.shift.city ?? null}
          actionLabel={t("viewShift")}
          onPress={() => router.push({ pathname: "/shift/[id]", params: { id: nextBooking.b.shift_id } })}
        />
      ) : (
        <EmptyState icon={CalendarClock} text={t("noUpcoming")} desc={isFacility ? undefined : t("emptyBookingsDesc")} />
      )}

      <Row gap={10}>
        <StatTile icon={ClipboardList} value={(applications.data ?? []).length} label={t("statApplications")} onPress={() => router.push("/activity")} />
        <StatTile icon={CalendarClock} value={(bookings.data ?? []).length} label={t("statBookings")} tone="accent" onPress={() => router.push("/activity")} />
        <StatTile icon={MailOpen} value={pendingInvites} label={t("statInvitations")} tone="violet" onPress={() => router.push("/activity")} />
      </Row>

      <SectionHeader title={t("latestJobs")} action={<Button label={t("viewAll")} variant="ghost" small onPress={() => router.push("/discover")} />} />
      {((jobs.data ?? []) as JobRow[]).slice(0, 3).map((job) => (
        <JobCard key={job.id} job={job} lang={lang} onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })} />
      ))}

      <SectionHeader title={t("latestShifts")} action={<Button label={t("viewAll")} variant="ghost" small onPress={() => router.push("/discover")} />} />
      {((shifts.data ?? []) as ShiftRow[]).slice(0, 3).map((shift) => (
        <ShiftCard
          key={shift.id}
          shift={shift}
          lang={lang}
          urgentLabel={t("urgent")}
          perHour={t("perHour")}
          onPress={() => router.push({ pathname: "/shift/[id]", params: { id: shift.id } })}
        />
      ))}

      <SectionHeader title={t("quickActions")} />
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <Button label={t("messages")} variant="secondary" icon={MessageCircle} onPress={() => router.push("/messages")} />
        </View>
        <View style={{ flex: 1 }}>
          {isFacility ? (
            <Button label={t("facilityWorkspace")} variant="secondary" icon={Building2} onPress={() => router.push("/facility")} />
          ) : (
            <Button label={t("profile")} variant="secondary" icon={UserRound} onPress={() => router.push("/profile")} />
          )}
        </View>
      </Row>
    </Screen>
  );
}
