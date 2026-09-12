import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, formatDateTime, formatMoney, hoursBetween } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/my-shifts")({
  head: () => ({
    meta: [
      { title: "مناوباتي | SyndeoCare" },
      { name: "description", content: "جدول مناوباتك المحجوزة وتفاصيل الأجر والمكان." },
      { property: "og:title", content: "مناوباتي | SyndeoCare" },
      { property: "og:description", content: "جدول المناوبات الطبية المحجوزة." },
    ],
  }),
  component: MyShifts,
});

const TXT = {
  ar: {
    title: "مناوباتي",
    sub: "جدولك القادم وتفاصيل الأجر.",
    loading: "جارٍ التحميل...",
    hours: (n: number) => `${n} ساعات`,
    cancel: "إلغاء الحجز",
    cancelled: "تم إلغاء الحجز",
    cancelFailed: "تعذّر الإلغاء",
    empty: "لا مناوبات محجوزة.",
    browse: "تصفح السوق",
  },
  en: {
    title: "My shifts",
    sub: "Your upcoming schedule and pay details.",
    loading: "Loading...",
    hours: (n: number) => `${n} hours`,
    cancel: "Cancel booking",
    cancelled: "Booking cancelled",
    cancelFailed: "Failed to cancel",
    empty: "No shifts booked.",
    browse: "Browse marketplace",
  },
} as const;

function MyShifts() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-shifts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_bookings")
        .select(
          "id,created_at,shifts(id,title,starts_at,ends_at,hourly_rate,currency,city,country)",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async ({ id, shiftId }: { id: string; shiftId: string }) => {
      const { error } = await supabase.from("shift_bookings").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("shifts").update({ status: "open", booked_by: null }).eq("id", shiftId);
    },
    onSuccess: () => {
      toast.success(c.cancelled);
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: () => toast.error(c.cancelFailed),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-muted-foreground">{c.sub}</p>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{c.loading}</p>
      ) : data?.length ? (
        <ul className="mt-6 space-y-4">
          {data.map((b) => {
            const s = b.shifts!;
            const hours = hoursBetween(s.starts_at, s.ends_at);
            return (
              <li key={b.id} className="card-lift flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-1 size-5 text-accent" />
                  <div>
                    <p className="font-bold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.city}، {countryLabel(s.country, lang)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(s.starts_at, lang)} · {c.hours(hours)}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-display text-lg font-extrabold text-accent">
                    {formatMoney(s.hourly_rate * hours, s.currency, lang)}
                  </p>
                  <Button size="sm" variant="ghost"
                    onClick={() => cancel.mutate({ id: b.id, shiftId: s.id })}
                    disabled={cancel.isPending}>
                    {c.cancel}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          {c.empty} <Link to="/shifts" className="text-primary underline">{c.browse}</Link>
        </p>
      )}
    </div>
  );
}
