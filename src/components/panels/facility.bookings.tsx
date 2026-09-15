import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CalendarCheck2, MessageSquare, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FacilityInterviewBlock } from "@/components/interview";
import { EmptyState } from "@/components/empty-state";
import { ReviewDialog } from "@/components/review-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    loading: "جارٍ التحميل...",
    healthcarePro: "كادر صحي",
    verified: "موثّق",
    experience: (n: number) => `خبرة ${n} سنة`,
    bookedAt: (time: string) => `حجز المناوبة ${time}`,
    message: "مراسلة",
    viewProfile: "الملف الكامل",
    empty: "لا توجد حجوزات بعد.",
    loadFailed: "تعذّر تحميل حجوزات هذه المناوبة.",
    retry: "إعادة المحاولة",
    chatOpened: "تم فتح المحادثة — اسم منشأتك ظاهر الآن للمرشح",
    chatFailed: "تعذّر بدء المحادثة",
    cancelled: "ملغي",
  },
  en: {
    loading: "Loading...",
    healthcarePro: "Healthcare professional",
    verified: "Verified",
    experience: (n: number) => `${n} years experience`,
    bookedAt: (time: string) => `Booked ${time}`,
    message: "Message",
    viewProfile: "Full profile",
    empty: "No bookings yet.",
    loadFailed: "We couldn't load bookings for this shift.",
    retry: "Try again",
    chatOpened: "Conversation opened — your facility name is now visible to the candidate",
    chatFailed: "Failed to start conversation",
    cancelled: "Cancelled",
  },
} as const;

export function FacilityBookingsPanel({
  shiftId,
  facilityId,
  shiftCompleted = false,
}: {
  shiftId: string;
  facilityId: string;
  shiftCompleted?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["facility-shift-bookings", shiftId],
    queryFn: async () => {
      const { data: bookings, error } = await supabase
        .from("shift_bookings")
        .select("id,status,created_at,user_id")
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
      return (bookings ?? []).map((b) => ({
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

  if (isLoading) return <p className="text-sm text-muted-foreground">{c.loading}</p>;
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
    <ul className="space-y-3">
      {data.map((b) => (
        <li key={b.id} className="rounded-xl border border-border bg-surface p-4">
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
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={startChat.isPending} onClick={() => startChat.mutate(b.user_id)}>
                <MessageSquare className="size-4" /> {c.message}
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/facility/candidates/$userId" params={{ userId: b.user_id }}>
                  <UserRound className="size-4" /> {c.viewProfile}
                </Link>
              </Button>
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
            />
          )}
        </li>
      ))}
    </ul>
  );
}
