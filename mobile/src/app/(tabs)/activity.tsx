import React, { useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Chip, EmptyState, ErrorState, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import {
  useMyApplications,
  useMyBookings,
  useMyInvitations,
  usePendingReviews,
  useRespondInvitation,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { applicationStatusLabel, bookingStatusLabel, formatDate, formatDateTime } from "@/lib/format";
import { userMessage } from "@/lib/errors";
import { ReviewDialog } from "@/components/review-dialog";

type Tab = "applications" | "bookings" | "invitations" | "reviews";

export default function ActivityTab() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { isFacility } = useAuth();
  const [tab, setTab] = useState<Tab>("applications");

  const applications = useMyApplications();
  const bookings = useMyBookings();
  const invitations = useMyInvitations();
  const reviews = usePendingReviews();
  const respond = useRespondInvitation();

  const refreshing =
    applications.isFetching || bookings.isFetching || invitations.isFetching || reviews.isFetching;

  const refetchAll = () => {
    void applications.refetch();
    void bookings.refetch();
    void invitations.refetch();
    void reviews.refetch();
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetchAll} />}>
      <Title>{t("activity")}</Title>

      {isFacility ? (
        <Button
          label={t("facilityWorkspace")}
          variant="secondary"
          onPress={() => router.push("/facility")}
        />
      ) : null}

      <Row gap={8} wrap>
        <Chip label={t("myApplications")} active={tab === "applications"} onPress={() => setTab("applications")} />
        <Chip label={t("myBookings")} active={tab === "bookings"} onPress={() => setTab("bookings")} />
        <Chip label={t("myInvitations")} active={tab === "invitations"} onPress={() => setTab("invitations")} />
        <Chip label={t("pendingReviews")} active={tab === "reviews"} onPress={() => setTab("reviews")} />
      </Row>

      {tab === "applications" ? (
        applications.isPending ? (
          <Loading />
        ) : applications.isError ? (
          <ErrorState message={userMessage(applications.error, lang)} onRetry={() => void applications.refetch()} />
        ) : (applications.data ?? []).length === 0 ? (
          <EmptyState text={t("emptyApplications")} />
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
                  label={lang === "ar" ? "عرض الوظيفة" : "View job"}
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
        bookings.isPending ? (
          <Loading />
        ) : (bookings.data ?? []).length === 0 ? (
          <EmptyState text={lang === "ar" ? "لا توجد مناوبات محجوزة." : "No booked shifts."} />
        ) : (
          (bookings.data ?? []).map((b) => {
            const shift = (b as unknown as { shifts?: { title?: string; starts_at?: string } }).shifts;
            return (
              <Card key={b.id}>
                <Row gap={8} wrap>
                  <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{shift?.title ?? "—"}</Text>
                  <Badge label={bookingStatusLabel(b.status, lang)} />
                </Row>
                <Text style={ui.muted}>{formatDateTime(shift?.starts_at ?? null, lang)}</Text>
                <Button
                  label={lang === "ar" ? "عرض المناوبة" : "View shift"}
                  variant="ghost"
                  small
                  onPress={() => router.push({ pathname: "/shift/[id]", params: { id: b.shift_id } })}
                />
              </Card>
            );
          })
        )
      ) : null}

      {tab === "invitations" ? (
        invitations.isPending ? (
          <Loading />
        ) : (invitations.data ?? []).length === 0 ? (
          <EmptyState text={lang === "ar" ? "لا توجد دعوات." : "No invitations."} />
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
                  <Badge label={inv.status} />
                </Row>
                {inv.message ? <Text style={ui.muted}>{inv.message}</Text> : null}
                {inv.status === "pending" ? (
                  <Row gap={8}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={lang === "ar" ? "قبول" : "Accept"}
                        small
                        loading={respond.isPending}
                        onPress={() => respond.mutate({ id: inv.id, accept: true })}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={lang === "ar" ? "رفض" : "Decline"}
                        variant="secondary"
                        small
                        onPress={() => respond.mutate({ id: inv.id, accept: false })}
                      />
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
        ) : (reviews.data ?? []).length === 0 ? (
          <EmptyState text={lang === "ar" ? "لا توجد تقييمات معلّقة." : "No pending reviews."} />
        ) : (
          (reviews.data ?? []).map((r, index) => (
            <ReviewDialog key={`${r.facility_id}-${r.job_id ?? r.shift_id ?? index}`} pending={r} />
          ))
        )
      ) : null}
    </Screen>
  );
}
