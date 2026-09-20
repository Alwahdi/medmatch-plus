import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BarChart3, Briefcase, CalendarClock, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { ListSkeleton } from "@/components/list-skeleton";

const TXT = {
  ar: {
    title: "التقرير الشهري",
    sub: "ملخّص نشاطك الحقيقي خلال آخر ستة أشهر: الطلبات والمناوبات ونتائجها.",
    loading: "جارٍ التحميل...",
    error: "تعذّر تحميل التقرير.",
    retry: "إعادة المحاولة",
    empty: "لا نشاط بعد — قدّم على وظيفة أو احجز مناوبة ليظهر تقريرك.",
    browse: "تصفح الفرص",
    applications: "طلبات الوظائف",
    bookings: "حجوزات مناوبات سارية",
    hired: "تم اختيارك",
    rejected: "غير مُختار",
    totalTitle: "الإجمالي خلال 6 أشهر",
    monthly: "التفصيل الشهري",
    noneThisMonth: "لا نشاط",
  },
  en: {
    title: "Monthly report",
    sub: "Your real activity over the last six months: applications, shifts and outcomes.",
    loading: "Loading...",
    error: "We couldn't load the report.",
    retry: "Try again",
    empty: "No activity yet — apply to a job or book a shift and your report appears here.",
    browse: "Browse opportunities",
    applications: "Job applications",
    bookings: "Active shift bookings",
    hired: "Selected",
    rejected: "Not selected",
    totalTitle: "Total over 6 months",
    monthly: "Monthly breakdown",
    noneThisMonth: "No activity",
  },
} as const;

type MonthRow = {
  key: string;
  label: string;
  applications: number;
  bookings: number;
  hired: number;
  rejected: number;
};

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** آخر 6 أشهر بترتيب تنازلي (الشهر الحالي أولاً). */
function lastSixMonths(lang: "ar" | "en") {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(d),
    });
  }
  return out;
}

/** تقرير شهري لنشاط الكادر — أرقام حقيقية من طلباته وحجوزاته فقط. */
export function ApplicantReportPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["applicant-report", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MonthRow[]> => {
      const since = new Date();
      since.setUTCMonth(since.getUTCMonth() - 5);
      since.setUTCDate(1);
      since.setUTCHours(0, 0, 0, 0);
      const sinceIso = since.toISOString();

      const [apps, bookings] = await Promise.all([
        supabase
          .from("applications")
          .select("created_at,status")
          .eq("user_id", user!.id)
          .gte("created_at", sinceIso),
        supabase
          .from("shift_bookings")
          .select("created_at,status")
          .eq("user_id", user!.id)
          .gte("created_at", sinceIso),
      ]);
      if (apps.error) throw apps.error;
      if (bookings.error) throw bookings.error;

      const rows = lastSixMonths(lang).map((m) => ({
        ...m,
        applications: 0,
        bookings: 0,
        hired: 0,
        rejected: 0,
      }));
      const byKey = new Map(rows.map((r) => [r.key, r]));

      for (const a of apps.data ?? []) {
        const r = byKey.get(monthKey(a.created_at));
        if (!r) continue;
        r.applications += 1;
        if (a.status === "hired") r.hired += 1;
        if (a.status === "rejected") r.rejected += 1;
      }
      for (const b of bookings.data ?? []) {
        const r = byKey.get(monthKey(b.created_at));
        if (!r) continue;
        if (b.status !== "cancelled") r.bookings += 1;
      }
      return rows;
    },
  });

  if (isLoading) return <ListSkeleton rows={2} />;
  if (isError)
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-card">
        <p className="text-sm text-muted-foreground">{c.error}</p>
        <Button className="mt-3" variant="outline" onClick={() => void refetch()}>
          {c.retry}
        </Button>
      </div>
    );

  const rows = data ?? [];
  const totals = rows.reduce(
    (acc, r) => ({
      applications: acc.applications + r.applications,
      bookings: acc.bookings + r.bookings,
      hired: acc.hired + r.hired,
      rejected: acc.rejected + r.rejected,
    }),
    { applications: 0, bookings: 0, hired: 0, rejected: 0 },
  );
  const hasActivity = totals.applications > 0 || totals.bookings > 0;
  const peak = Math.max(1, ...rows.map((r) => r.applications + r.bookings));

  return (
    <section>
      <div className="flex items-center gap-2">
        <BarChart3 className="size-5 text-primary" />
        <h2 className="font-display text-xl font-extrabold">{c.title}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>

      {!hasActivity ? (
        <div className="mt-4">
          <EmptyState
            icon={BarChart3}
            title={c.empty}
            action={
              <Button asChild>
                <Link to="/jobs">{c.browse}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Briefcase} label={c.applications} value={totals.applications} />
            <Stat icon={CalendarClock} label={c.bookings} value={totals.bookings} />
            <Stat icon={CheckCircle2} label={c.hired} value={totals.hired} />
            <Stat icon={XCircle} label={c.rejected} value={totals.rejected} />
          </div>

          <h3 className="mt-6 text-sm font-bold">{c.monthly}</h3>
          <ul className="mt-2 space-y-2">
            {rows.map((r) => {
              const total = r.applications + r.bookings;
              return (
                <li key={r.key} className="rounded-lg border border-border bg-card p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">{r.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {total === 0
                        ? c.noneThisMonth
                        : `${c.applications}: ${r.applications} · ${c.bookings}: ${r.bookings} · ${c.hired}: ${r.hired}`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.round((total / peak) * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
