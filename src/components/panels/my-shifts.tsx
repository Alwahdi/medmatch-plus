import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ReviewDialog } from "@/components/review-dialog";
import { CandidateInterviewBlock } from "@/components/interview";
import { useConfirm } from "@/components/confirm-dialog";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, formatDateTime, formatMoney, hoursBetween } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { employerText, useInactiveEmployers } from "@/lib/employer";
import { ListSkeleton } from "@/components/list-skeleton";


const TXT = {
  ar: {
    title: "مناوباتي",
    sub: "جدولك القادم وتفاصيل الأجر.",
    hours: (n: number) => `${n} ساعات`,
    cancel: "إلغاء الحجز",
    cancelled: "تم إلغاء الحجز",
    cancelFailed: "تعذّر الإلغاء. لا يمكن إلغاء الحجز بعد بدء المناوبة.",
    started: "بدأت المناوبة — لا يمكن الإلغاء",
    confirmTitle: "إلغاء حجز المناوبة؟",
    confirmDesc: "ستُعاد المناوبة للسوق ويمكن لكادر آخر حجزها. لا يمكن التراجع عن هذا الإجراء.",
    confirmCta: "نعم، ألغِ الحجز",
    keep: "احتفظ بالحجز",
    empty: "لا مناوبات محجوزة.",
    cancelledBadge: "حجز ملغى",
    cancelledOn: (d: string) => `أُلغي في ${d}`,
    cancelledByFacility: "ألغته المنشأة",
    cancelledByMe: "ألغيته",
    browse: "تصفح السوق",
    error: "تعذّر تحميل مناوباتك.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "My shifts",
    sub: "Your upcoming schedule and pay details.",
    hours: (n: number) => `${n} hours`,
    cancel: "Cancel booking",
    cancelled: "Booking cancelled",
    cancelFailed: "Couldn't cancel. Bookings can't be cancelled after the shift starts.",
    started: "Shift started — cannot cancel",
    confirmTitle: "Cancel this shift booking?",
    confirmDesc: "The shift returns to the marketplace and another professional can book it. This can't be undone.",
    confirmCta: "Yes, cancel booking",
    keep: "Keep booking",
    empty: "No shifts booked.",
    cancelledBadge: "Cancelled booking",
    cancelledOn: (d: string) => `Cancelled on ${d}`,
    cancelledByFacility: "Cancelled by the facility",
    cancelledByMe: "Cancelled by you",
    browse: "Browse marketplace",
    error: "We couldn't load your shifts.",
    retry: "Try again",
  },

} as const;

export function MyShiftsPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();
  const inactiveEmployers = useInactiveEmployers();
  const emp = employerText(lang);



  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-shifts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_bookings")
        .select(
          "id,created_at,status,cancelled_at,cancellation_actor,shifts(id,title,starts_at,ends_at,hourly_rate,currency,city,country,facility_id,status)",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.rpc("cancel_my_shift_booking", { _booking_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.cancelled);
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: () => toast.error(c.cancelFailed),
  });

  return (
    <div>
      {confirmDialog}

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <EmptyState className="mt-6" icon={AlertCircle} title={c.error} action={<Button variant="outline" onClick={() => void refetch()}>{c.retry}</Button>} />
      ) : data?.length ? (
        <ul className="space-y-3">
          {data.map((b) => {
            const s = b.shifts!;
            const hours = hoursBetween(s.starts_at, s.ends_at);
            const employerGone = inactiveEmployers.has(s.facility_id);
            const isCancelled = b.status === "cancelled";
            return (
              <li key={b.id} className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground"><CalendarClock className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{s.title}</p>
                    {isCancelled && (
                      <p className="mt-1 inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {c.cancelledBadge}
                        {b.cancelled_at ? ` · ${c.cancelledOn(formatDateTime(b.cancelled_at, lang))}` : ""}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {s.city}، {countryLabel(s.country, lang)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(s.starts_at, lang)} · {c.hours(hours)}</p>
                  </div>
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-display text-lg font-extrabold text-accent">
                    {formatMoney(s.hourly_rate * hours, s.currency, lang)}
                  </p>
                  {b.status === "confirmed" && s.status === "completed" && user && !employerGone && (
                    <div className="mt-1 flex justify-end">
                      <ReviewDialog
                        direction="pro_to_facility"
                        facilityId={s.facility_id}
                        professionalUserId={user.id}
                        authorUserId={user.id}
                        targetName={s.title}
                        shiftId={s.id}
                      />
                    </div>
                  )}
                  {isCancelled ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.cancellation_actor === "facility" ? c.cancelledByFacility : c.cancelledByMe}
                    </p>
                  ) : new Date(s.starts_at).getTime() > Date.now() ? (
                    <Button size="sm" variant="ghost"
                      onClick={async () => {
                        const ok = await confirm({
                          title: c.confirmTitle,
                          description: c.confirmDesc,
                          confirmLabel: c.confirmCta,
                          cancelLabel: c.keep,
                          destructive: true,
                        });
                        if (ok) cancel.mutate({ id: b.id });
                      }}
                      loading={cancel.isPending}>
                      {c.cancel}
                    </Button>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">{c.started}</p>
                  )}

                </div>
                </div>
                {isCancelled ? null : employerGone ? (
                  <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">{emp.unavailable}</span> — {emp.unavailableNote}
                  </p>
                ) : (
                  <CandidateInterviewBlock shiftBookingId={b.id} />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          {c.empty} <Link to="/jobs" search={{ kind: "shift" }} className="text-primary underline">{c.browse}</Link>
        </p>
      )}
    </div>
  );
}
