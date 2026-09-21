import React, { useMemo, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CalendarClock, ClipboardList, MailOpen, Star, UsersRound } from "lucide-react-native";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Loading,
  Row,
  Screen,
  ScreenHeader,
  Segmented,
  styles as ui,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  useMyApplications,
  useMyBookings,
  useMyInvitations,
  useMyFacility,
  useFacilityJobs,
  usePendingReviews,
  useRespondInvitation,
  useMyInterviews,
  useRespondInterview,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { applicationStatusLabel, bookingStatusLabel, formatDate, formatDateTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { ReviewDialog } from "@/components/review-dialog";
import { colors } from "@/lib/theme";

type Tab = "applications" | "bookings" | "invitations" | "interviews" | "reviews";
type TimeRange = "upcoming" | "past";

export default function ActivityTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { isFacility } = useAuth();
  const [tab, setTab] = useState<Tab>("applications");
  const [range, setRange] = useState<TimeRange>("upcoming");

  const applications = useMyApplications();
  const bookings = useMyBookings();
  const invitations = useMyInvitations();
  const reviews = usePendingReviews();
  const respond = useRespondInvitation();
  const interviews = useMyInterviews();
  const respondInterview = useRespondInterview();

  const refreshing =
    applications.isFetching || bookings.isFetching || invitations.isFetching || interviews.isFetching || reviews.isFetching;

  const refetchAll = () => {
    void applications.refetch();
    void bookings.refetch();
    void invitations.refetch();
    void interviews.refetch();
    void reviews.refetch();
  };

  const pendingInvites = (invitations.data ?? []).filter((i) => i.status === "pending").length;
  const reviewCount = ((reviews.data as unknown[] | undefined) ?? []).length;

  const shiftOf = (b: unknown) =>
    (b as { shifts?: { title?: string; starts_at?: string; city?: string } }).shifts;

  const rangedBookings = useMemo(() => {
    const now = Date.now();
    return (bookings.data ?? []).filter((b) => {
      const s = shiftOf(b)?.starts_at;
      if (!s) return range === "past";
      return range === "upcoming" ? new Date(s).getTime() >= now : new Date(s).getTime() < now;
    });
  }, [bookings.data, range]);

  if (isFacility) {
    return <FacilityApplicantsOverview />;
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={colors.primary} />}>
      <ScreenHeader
        title={t("activity")}
        sub={lang === "ar" ? "طلباتك ومناوباتك ودعواتك في مكان واحد" : "Applications, shifts and invitations in one place"}
      />

      <Row gap={8} wrap>
        <Chip label={t("myApplications")} active={tab === "applications"} onPress={() => setTab("applications")} />
        <Chip label={t("myBookings")} active={tab === "bookings"} onPress={() => setTab("bookings")} />
        <Chip label={pendingInvites ? `${t("myInvitations")} (${pendingInvites})` : t("myInvitations")} active={tab === "invitations"} onPress={() => setTab("invitations")} />
        <Chip label={t("interviews")} active={tab === "interviews"} onPress={() => setTab("interviews")} />
        <Chip label={reviewCount ? `${t("pendingReviews")} (${reviewCount})` : t("pendingReviews")} active={tab === "reviews"} onPress={() => setTab("reviews")} />
      </Row>

      {tab === "applications" ? (
        applications.isPending ? (
          <Loading />
        ) : applications.isError ? (
          <ErrorState message={userMessage(applications.error, lang)} onRetry={() => void applications.refetch()} />
        ) : (applications.data ?? []).length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            text={t("emptyApplications")}
            desc={t("emptyApplicationsDesc")}
            action={<Button label={t("browseJobs")} small onPress={() => router.push("/discover")} />}
          />
        ) : (
          (applications.data ?? []).map((a) => {
            const job = (a as unknown as { jobs?: { title?: string; city?: string } }).jobs;
            return (
              <Card key={a.id}>
                <Row gap={8} wrap>
                  <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{job?.title ?? "—"}</Text>
                  <Badge label={applicationStatusLabel(a.status, lang)} tone="primary" />
                </Row>
                <Text style={ui.muted}>{formatDate(a.created_at, lang)}</Text>
                <Button
                  label={t("viewJob")}
                  variant="ghost"
                  small
                  onPress={() => router.push({ pathname: "/job/[id]", params: { id: a.job_id } })}
                />
              </Card>
            );
          })
        )
      ) : null}

      {tab === "bookings" ? (
        <>
          <Segmented<TimeRange>
            value={range}
            onChange={setRange}
            options={[
              { value: "upcoming", label: t("timeUpcoming") },
              { value: "past", label: t("timePast") },
            ]}
          />
          {bookings.isPending ? (
            <Loading />
          ) : bookings.isError ? (
            <ErrorState message={userMessage(bookings.error, lang)} onRetry={() => void bookings.refetch()} />
          ) : rangedBookings.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              text={lang === "ar" ? "لا توجد مناوبات هنا." : "No shifts here."}
              desc={t("emptyBookingsDesc")}
              action={<Button label={t("browseShifts")} small onPress={() => router.push("/discover")} />}
            />
          ) : (
            rangedBookings.map((b) => {
              const shift = shiftOf(b);
              return (
                <Card key={b.id}>
                  <Row gap={8} wrap>
                    <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{shift?.title ?? "—"}</Text>
                    <Badge label={bookingStatusLabel(b.status, lang)} />
                  </Row>
                  <Text style={ui.muted}>{formatDateTime(shift?.starts_at ?? null, lang)}</Text>
                  <Button
                    label={t("viewShift")}
                    variant="ghost"
                    small
                    onPress={() => router.push({ pathname: "/shift/[id]", params: { id: b.shift_id } })}
                  />
                </Card>
              );
            })
          )}
        </>
      ) : null}

      {tab === "invitations" ? (
        invitations.isPending ? (
          <Loading />
        ) : invitations.isError ? (
          <ErrorState message={userMessage(invitations.error, lang)} onRetry={() => void invitations.refetch()} />
        ) : (invitations.data ?? []).length === 0 ? (
          <EmptyState icon={MailOpen} text={lang === "ar" ? "لا توجد دعوات." : "No invitations."} desc={t("emptyInvitationsDesc")} />
        ) : (
          (invitations.data ?? []).map((inv) => {
            const title =
              (inv as unknown as { jobs?: { title?: string }; shifts?: { title?: string } }).jobs?.title ??
              (inv as unknown as { shifts?: { title?: string } }).shifts?.title ??
              "—";
            return (
              <Card key={inv.id}>
                <Row gap={8} wrap>
                  <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{title}</Text>
                  <Badge label={inv.status} tone={inv.status === "pending" ? "warning" : "neutral"} />
                </Row>
                {inv.message ? <Text style={ui.muted}>{inv.message}</Text> : null}
                {inv.status === "pending" ? (
                  <Row gap={8}>
                    <View style={{ flex: 1 }}>
                      <Button label={t("accept")} small loading={respond.isPending} onPress={() => respond.mutate({ id: inv.id, accept: true })} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button label={t("decline")} variant="secondary" small onPress={() => respond.mutate({ id: inv.id, accept: false })} />
                    </View>
                  </Row>
                ) : null}
              </Card>
            );
          })
        )
      ) : null}

      {tab === "reviews" ? (
        reviews.isPending ? (
          <Loading />
        ) : reviewCount === 0 ? (
          <EmptyState icon={Star} text={lang === "ar" ? "لا توجد تقييمات معلّقة." : "No pending reviews."} desc={t("emptyReviewsDesc")} />
        ) : (
          (reviews.data ?? []).map((r, index) => (
            <ReviewDialog key={`${r.facility_id}-${r.job_id ?? r.shift_id ?? index}`} pending={r} />
          ))
        )
      ) : null}
      {tab === "interviews" ? interviews.isPending ? <Loading /> : interviews.isError ? <ErrorState message={userMessage(interviews.error, lang)} onRetry={() => void interviews.refetch()} /> : (interviews.data ?? []).length === 0 ? <EmptyState icon={CalendarClock} text={t("noUpcoming")} /> : (interviews.data ?? []).map((interview) => {
        const context = interview as unknown as { jobs?: { title?: string }; shifts?: { title?: string } };
        const title = context.jobs?.title ?? context.shifts?.title ?? t("interviewInvite");
        return <Card key={interview.id}><Row gap={8} wrap><Text style={[ui.bodyStrong, { flex: 1 }]}>{title}</Text><Badge label={interview.status} tone={interview.status === "confirmed" ? "success" : interview.status === "declined" ? "danger" : "warning"} /></Row><Text style={ui.body}>{formatDateTime(interview.scheduled_at, lang)}</Text>{interview.location ? <Text style={ui.muted}>{interview.location}</Text> : null}{interview.status === "scheduled" ? <Row gap={8}><View style={{ flex: 1 }}><Button label={t("accept")} small loading={respondInterview.isPending} onPress={() => respondInterview.mutate({ id: interview.id, accept: true })} /></View><View style={{ flex: 1 }}><Button label={t("decline")} variant="secondary" small onPress={() => respondInterview.mutate({ id: interview.id, accept: false })} /></View></Row> : null}</Card>;
      }) : null}
    </Screen>
  );
}

function FacilityApplicantsOverview() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const facility = useMyFacility();
  const facilityId = (facility.data as { id?: string } | null)?.id;
  const jobs = useFacilityJobs(facilityId);
  const withApplicants = (jobs.data ?? []).filter((job) => (job.applications_count ?? 0) > 0);
  return (
    <Screen refreshControl={<RefreshControl refreshing={jobs.isFetching} onRefresh={() => void jobs.refetch()} tintColor={colors.primary} />}>
      <ScreenHeader title={t("applicants")} sub={t("facilityApplicantsSub")} />
      {jobs.isPending ? <Loading /> : jobs.isError ? (
        <ErrorState message={userMessage(jobs.error, lang)} onRetry={() => void jobs.refetch()} />
      ) : withApplicants.length === 0 ? (
        <EmptyState icon={UsersRound} text={lang === "ar" ? "لا يوجد متقدمون جدد" : "No new applicants"} desc={t("facilityApplicantsSub")} action={<Button label={t("myListings")} small onPress={() => router.push("/discover")} />} />
      ) : withApplicants.map((job) => (
        <Card key={job.id}>
          <Row gap={8} wrap><Text style={[ui.bodyStrong, { flex: 1 }]}>{job.title}</Text><Badge label={String(job.applications_count ?? 0)} tone="primary" /></Row>
          <Text style={ui.muted}>{job.city} · {formatDate(job.created_at, lang)}</Text>
          <Button label={t("reviewApplicants")} variant="secondary" small onPress={() => router.push({ pathname: "/facility/job/[id]", params: { id: job.id } })} />
        </Card>
      ))}
    </Screen>
  );
}
