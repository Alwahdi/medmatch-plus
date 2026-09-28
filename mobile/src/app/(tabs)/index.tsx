import React, { useMemo } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react-native";
import { Button, EmptyState, IconButton, PriorityCard, Screen, ScreenHeader, SectionHeader } from "@/components/ui";
import { JobCard, ShiftCard, StatusCard } from "@/components/cards";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  useFacilityJobs,
  useFacilityShifts,
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

function NotificationButton({ count, onPress, label }: { count: number; onPress: () => void; label: string }) {
  return (
    <View>
      <IconButton icon={Bell} label={label} onPress={onPress} />
      {count > 0 ? (
        <View style={{ position: "absolute", top: -4, end: -4, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: radii.pill, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: colors.primaryText }}>{count > 9 ? "9+" : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function HomeTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user, isFacility } = useAuth();
  const professional = useProfessionalProfile();
  const facility = useMyFacility();
  const facilityId = (facility.data as { id?: string } | null)?.id;
  const facilityJobs = useFacilityJobs(facilityId);
  const facilityShifts = useFacilityShifts(facilityId);
  const applications = useMyApplications();
  const bookings = useMyBookings();
  const invitations = useMyInvitations();
  const notifications = useNotifications();
  const jobs = useJobSearch({ q: "" });
  const shifts = useShiftSearch({ q: "" });

  const p = professional.data as { full_name?: string; headline?: string | null; is_verified?: boolean } | null;
  const f = facility.data as { name_ar?: string; name_en?: string | null; is_verified?: boolean } | null;
  const name = ((lang === "ar" ? f?.name_ar : f?.name_en || f?.name_ar) ?? p?.full_name ?? user?.email ?? "").split("@")[0] ?? "";
  const unread = (notifications.data ?? []).filter((item) => !item.read_at).length;

  const nextBooking = useMemo(() => {
    const now = Date.now();
    return (bookings.data ?? [])
      .map((booking) => ({ booking, shift: (booking as unknown as { shifts?: { title?: string; starts_at?: string; city?: string } }).shifts }))
      .filter((item) => item.shift?.starts_at && new Date(item.shift.starts_at).getTime() > now && item.booking.status === "confirmed")
      .sort((a, b) => new Date(a.shift?.starts_at ?? 0).getTime() - new Date(b.shift?.starts_at ?? 0).getTime())[0];
  }, [bookings.data]);

  const refreshing = notifications.isFetching || (isFacility
    ? facilityJobs.isFetching || facilityShifts.isFetching
    : applications.isFetching || bookings.isFetching || invitations.isFetching || jobs.isFetching || shifts.isFetching);

  const refresh = () => {
    void notifications.refetch();
    if (isFacility) {
      void facility.refetch();
      void facilityJobs.refetch();
      void facilityShifts.refetch();
      return;
    }
    void professional.refetch();
    void applications.refetch();
    void bookings.refetch();
    void invitations.refetch();
    void jobs.refetch();
    void shifts.refetch();
  };

  const header = (
    <ScreenHeader
      title={t("helloName").replace("{name}", name || t("account"))}
      sub={isFacility ? t("homeSubFac") : t("homeSubPro")}
      action={<NotificationButton count={unread} label={t("notifications")} onPress={() => router.push("/notifications")} />}
    />
  );

  if (isFacility) {
    return (
      <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
        {header}
        <PriorityCard
          icon={f?.is_verified ? UsersRound : ShieldCheck}
          eyebrow={t("priorityNow")}
          title={f?.is_verified ? t("facilityPriority") : t("nextFac2")}
          description={f?.is_verified ? t("facilityPriorityDesc") : t("nextFac2Sub")}
          actionLabel={f?.is_verified ? t("manageListings") : t("completeNow")}
           onPress={() => router.push(!f ? "/facility/profile" : f.is_verified ? "/discover" : { pathname: "/verification", params: { target: "facility" } })}
          tone={f?.is_verified ? "primary" : "warning"}
        />
        {f?.is_verified ? <>
          <SectionHeader title={t("quickActions")} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><Button label={t("publishJob")} onPress={() => router.push("/facility/create-job")} /></View>
            <View style={{ flex: 1 }}><Button label={t("publishShift")} variant="secondary" onPress={() => router.push("/facility/create-shift")} /></View>
          </View>
        </> : null}
      </Screen>
    );
  }

  const profileIncomplete = !p?.headline;
  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}>
      {header}
      {profileIncomplete ? (
        <PriorityCard
          icon={UserRound}
          eyebrow={t("completeYourProfile")}
          title={t("profileNeedsWork")}
          description={t("profileNeedsWorkDesc")}
          actionLabel={t("completeNow")}
          onPress={() => router.push("/profile")}
        />
      ) : nextBooking?.shift ? (
        <StatusCard
          title={nextBooking.shift.title ?? "—"}
          when={`${formatDateTime(nextBooking.shift.starts_at, lang)} · ${t("startsIn").replace("{t}", relativeTime(nextBooking.shift.starts_at, lang))}`}
          place={nextBooking.shift.city ?? null}
          actionLabel={t("viewShift")}
          onPress={() => router.push({ pathname: "/shift/[id]", params: { id: nextBooking.booking.shift_id } })}
        />
      ) : (
        <PriorityCard
          icon={ClipboardList}
          eyebrow={t("nextUp")}
          title={t("noUpcoming")}
          description={t("emptyApplicationsDesc")}
          actionLabel={t("browseJobs")}
          onPress={() => router.push("/discover")}
          tone="accent"
        />
      )}
      <SectionHeader title={t("matchedForYou")} />
      {((jobs.data ?? []) as JobRow[]).slice(0, 2).map((job) => (
        <JobCard key={job.id} job={job} lang={lang} onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })} />
      ))}
      {((shifts.data ?? []) as ShiftRow[]).slice(0, 1).map((shift) => (
        <ShiftCard key={shift.id} shift={shift} lang={lang} urgentLabel={t("urgent")} perHour={t("perHour")} onPress={() => router.push({ pathname: "/shift/[id]", params: { id: shift.id } })} />
      ))}
      {(jobs.data ?? []).length === 0 && (shifts.data ?? []).length === 0 ? (
        <EmptyState icon={BriefcaseBusiness} text={t("emptyJobs")} desc={t("emptyJobsDesc")}  />
      ) : null}
    </Screen>
  );
}