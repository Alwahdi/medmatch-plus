import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CalendarCheck2, MessageSquare, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FacilityInterviewBlock } from "@/components/interview";
import { EmptyState } from "@/components/empty-state";
import { ReviewDialog } from "@/components/review-dialog";
import { RehireDialog } from "@/components/rehire-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, relativeTime, experienceLabel } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { useConfirm } from "@/components/confirm-dialog";
import { ListSkeleton } from "@/components/list-skeleton";

const TXT = {
  ar: {
    healthcarePro: "كادر صحي",
    verified: "موثّق",
    experience: (n: number) => experienceLabel(n, "ar"),
    bookedAt: (time: string) => `حجز المناوبة ${time}`,
    message: "مراسلة",
    viewProfile: "الملف الكامل",
    empty: "لا توجد حجوزات بعد.",
    loadFailed: "تعذّر تحميل حجوزات هذه المناوبة.",
    retry: "إعادة المحاولة",
    chatOpened: "تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح",
    chatFailed: "تعذّر بدء المحادثة",
    cancelled: "ملغي",
    cancelledAt: (time: string, actor: string) => `أُلغي ${time} — ${actor}`,
    byPro: "من المختص",
    byFacility: "من المنشأة",
    historyNote: "محاولة حجز سابقة محفوظة للسجل فقط.",
    revealTitle: "بدء المحادثة مع صاحب الحجز؟",
    revealDesc: "عند بدء المحادثة سيظهر اسم منشأتك لهذا المختص حتى تكون المحادثة واضحة للطرفين.",
    revealCta: "ابدأ المحادثة",
  },
  en: {
    healthcarePro: "Healthcare professional",
    verified: "Verified",
    experience: (n: number) => experienceLabel(n, "en"),
    bookedAt: (time: string) => `Booked ${time}`,
    message: "Message",
    viewProfile: "Full profile",
    empty: "No bookings yet.",
    loadFailed: "We couldn't load bookings for this shift.",
    retry: "Try again",
    chatOpened: "Conversation opened — your facility name is now visible to the candidate",
    chatFailed: "Failed to start conversation",
    cancelled: "Cancelled",
    cancelledAt: (time: string, actor: string) => `Cancelled ${time} — ${actor}`,
    byPro: "by the professional",
    byFacility: "by the facility",
    historyNote: "Past booking attempt, kept for your records only.",
    revealTitle: "Start a conversation with this professional?",
    revealDesc: "Starting the conversation reveals your facility name to this professional so both sides know who they are speaking with.",
    revealCta: "Start conversation",
  },
} as const;

export function FacilityBookingsPanel({
  shiftId,
  facilityId,
  shiftCompleted = false,
  shiftStartsAt,
  shiftStatus,
}: {
  shiftId: string;
  facilityId: string;
  shiftCompleted?: boolean;
  shiftStartsAt?: string;
  shiftStatus?: string;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["facility-shift-bookings", shiftId],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("shift_bookings")
        .select("id,status,created_at,cancelled_at,cancellation_actor,user_id")
        .eq("shift_id", shiftId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const userIds = Array.from(new Set((bookings ?? []).map((b) => b.user_id)));
      if (userIds.length === 0) return [];
      const { data: pros, error: prosError } = await supabase
        .from("healthcare_professionals")
        .select("user_id,full_name,headline,years_experience,country,city,is_verified")
        .in("user_id", userIds);
      if (prosError) throw prosError;
      const sorted = [...(bookings ?? [])].sort((a, b) =>
        a.status === b.status ? 0 : a.status === "confirmed" ? -1 : 1,
      );
      return sorted.map((b) => ({
        ...b,
        pro: pros?.find((p) => p.user_id === b.user_id) ?? null,
      }));
    },
  });

  const startChat = useMutation({
    mutationFn: async (candidateUserId: string) => {
      const { error } = await supabase.rpc("start_candidate_conversation", {
        _professional_user_id: candidateUserId,
        _shift_id: shiftId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.chatOpened);
      navigate({ to: "/messages" });
    },
    onError: () => toast.error(c.chatFailed),
  });

  if (isLoading) return <ListSkeleton rows={1} />;
  if (isError)
    return (
      <EmptyState
        icon={AlertCircle}
        title={c.loadFailed}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            {c.retry}
          </Button>
        }
      />
    );
  if (!data?.length) return <EmptyState icon={CalendarCheck2} title={c.empty} />;

  return (
    <>
    {confirmDialog}
    <ul className="space-y-3">
      {data.map((b) => (
        <li key={b.id} className="rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold">
                {b.pro?.full_name ?? c.healthcarePro}
                {b.pro?.is_verified && (
                  <Badge className="ms-2" variant="secondary">
                    {c.verified}
                  </Badge>
                )}
                {b.status === "cancelled" && (
                  <Badge className="ms-2" variant="outline">
                    {c.cancelled}
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {b.pro?.headline ?? "—"} · {c.experience(b.pro?.years_experience ?? 0)} ·{" "}
                {[b.pro?.city, countryLabel(b.pro?.country, lang)].filter(Boolean).join("، ")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{c.bookedAt(relativeTime(b.created_at, lang))}</p>
              {b.status === "cancelled" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {b.cancelled_at
                    ? c.cancelledAt(
                        relativeTime(b.cancelled_at, lang),
                        b.cancellation_actor === "facility" ? c.byFacility : c.byPro,
                      )
                    : c.historyNote}
                </p>
              )}
            </div>
            <div className={b.status === "cancelled" ? "hidden" : "grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap"}>
              <Button size="sm" variant="outline" loading={startChat.isPending} onClick={async () => {
                const ok = await confirm({
                  title: c.revealTitle,
                  description: c.revealDesc,
                  confirmLabel: c.revealCta,
                });
                if (ok) startChat.mutate(b.user_id);
              }}>
                <MessageSquare className="size-4" /> {c.message}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/facility/candidates/$userId" params={{ userId: b.user_id }}>
                  <UserRound className="size-4" /> {c.viewProfile}
                </Link>
              </Button>
              {shiftCompleted && b.status === "confirmed" && (
                <RehireDialog shiftId={shiftId} candidateName={b.pro?.full_name ?? c.healthcarePro} />
              )}
              {shiftCompleted && b.status === "confirmed" && user && (
                <ReviewDialog
                  direction="facility_to_pro"
                  facilityId={facilityId}
                  professionalUserId={b.user_id}
                  authorUserId={user.id}
                  targetName={b.pro?.full_name ?? c.healthcarePro}
                  shiftId={shiftId}
                />
              )}
            </div>
          </div>
          {b.status !== "cancelled" && (
            <FacilityInterviewBlock
              shiftBookingId={b.id}
              candidateName={b.pro?.full_name ?? c.healthcarePro}
              {...(shiftStartsAt ? { shiftStartsAt } : {})}
              shiftLive={shiftStatus === "booked"}
            />
          )}
        </li>
      ))}
    </ul>
    </>
  );
}
