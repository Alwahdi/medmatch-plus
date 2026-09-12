import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, CalendarClock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_public/shifts")({
  head: () => ({
    meta: [
      { title: "سوق المناوبات الطبية الفورية | SyndeoCare" },
      {
        name: "description",
        content:
          "احجز مناوبة طبية فورية بأجر بالساعة معلن في مستشفيات وعيادات اليمن والمنطقة العربية — تمريض، طوارئ، صيدلة، أسنان وأشعة.",
      },
      { property: "og:title", content: "سوق المناوبات الطبية | SyndeoCare" },
      { property: "og:description", content: "مناوبات طبية متاحة للحجز الفوري بأجر بالساعة معلن." },
    ],
  }),
  component: ShiftsPage,
});

const ALL = "all";

const TXT = {
  ar: {
    badge: "شيفتات فورية بأجر بالساعة",
    title: "سوق المناوبات الطبية",
    sub: "مناوبات معلنة بأجر واضح في مستشفيات وعيادات المنطقة العربية — احجزها مباشرة بدون وسيط.",
    pick: "اختر الدولة",
    allCountries: "كل الدول",
    label: "متاحة للحجز",
    count: (n: number) => `${n} مناوبة متاحة`,
    employer: "أنت ناشر شيفتات؟",
    empty: "لا توجد مناوبات متاحة حالياً.",
    showAll: "عرض كل الدول",
    guest: "سجّل دخولك لحجز المناوبات ومتابعة جدولك.",
    signIn: "تسجيل الدخول",
    booked: "تم حجز المناوبة — ستجدها في صفحة مناوباتي",
    failed: "تعذّر الحجز، ربما حُجزت المناوبة للتو",
  },
  en: {
    badge: "Instant shifts with hourly pay",
    title: "Medical shift marketplace",
    sub: "Shifts with clearly published pay in hospitals and clinics across the Arab region — book directly, no middleman.",
    pick: "Choose a country",
    allCountries: "All countries",
    label: "Open for booking",
    count: (n: number) => `${n} shifts available`,
    employer: "Posting shifts? See plans",
    empty: "No shifts available right now.",
    showAll: "Show all countries",
    guest: "Sign in to book shifts and track your schedule.",
    signIn: "Sign in",
    booked: "Shift booked — you'll find it under My shifts",
    failed: "Booking failed, the shift may have just been taken",
  },
} as const;

function ShiftsPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [country, setCountry] = useState(ALL);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(
          "id,title,notes,starts_at,ends_at,hourly_rate,currency,country,city,status,is_urgent,facility_verified,applications_count,specialties(name_ar,name_en)",
        )
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as unknown as ShiftRow[];
    },
  });

  const book = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from("shift_bookings")
        .insert({ shift_id: shiftId, user_id: user!.id });
      if (error) throw error;
      const { error: upErr } = await supabase
        .from("shifts")
        .update({ status: "booked", booked_by: user!.id })
        .eq("id", shiftId);
      if (upErr && upErr.code !== "42501") throw upErr;
    },
    onSuccess: () => {
      toast.success(c.booked);
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
    },
    onError: () => toast.error(c.failed),
  });

  const countries = useMemo(() => Array.from(new Set((shifts ?? []).map((s) => s.country))), [shifts]);
  const filtered = (shifts ?? []).filter((s) => country === ALL || s.country === country);

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <CalendarClock className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">{c.sub}</p>
        </div>
      </section>

      {/* Filter */}
      <div className="relative px-4">
        <div className="mx-auto max-w-xl -translate-y-1/2">
          <div className="card-lift flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-lg">
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-11 pr-9">
                  <SelectValue placeholder={c.pick} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{c.allCountries}</SelectItem>
                  {countries.map((x) => (
                    <SelectItem key={x} value={x}>
                      {countryLabel(x, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label">{c.label}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold">{c.count(filtered.length)}</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/pricing">
                {c.employer} <ArrowLeft className="size-4 ltr:rotate-180" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-muted-foreground">{c.empty}</p>
              <Button className="mt-4" variant="outline" onClick={() => setCountry(ALL)}>
                {c.showAll}
              </Button>
            </div>
          ) : (
            <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-4">
              {filtered.map((shift) => (
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  busy={book.isPending}
                  onBook={() => {
                    if (!user) {
                      navigate({ to: "/auth" });
                      return;
                    }
                    book.mutate(shift.id);
                  }}
                />
              ))}
            </div>
          )}

          {!user && (
            <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-sm text-muted-foreground">{c.guest}</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/auth" })}>
                {c.signIn}
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
