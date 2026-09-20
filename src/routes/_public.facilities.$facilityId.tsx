import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Globe,
  Lock,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { RatingStars } from "@/components/rating-stars";
import { RemoteAvatar } from "@/components/remote-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, formatDateTime, formatMoney, formatSalary } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { OnlineDotClass, useOnlineUsers } from "@/lib/presence";
import { ErrorState } from "@/components/error-state";
import { NOINDEX } from "@/lib/seo";

const TXT = {
  ar: {
    home: "الرئيسية",
    crumb: "المنشآت",
    back: "العودة للوظائف",
    hiddenTitle: "هوية هذه المنشأة محجوبة",
    hiddenBody:
      "تظهر لك بيانات المنشأة كاملة بعد قبول طلبك أو بدء المنشأة للتواصل معك — هذه سياسة خصوصية نطبّقها على كل الناشرين.",
    browseJobs: "تصفح الوظائف",
    verified: "منشأة موثّقة",
    unverified: "بانتظار التوثيق",
    about: "نبذة عن المنشأة",
    noAbout: "لم تضف المنشأة نبذة تعريفية بعد.",
    website: "الموقع الإلكتروني",
    jobs: "الوظائف المنشورة",
    shifts: "المناوبات المتاحة",
    noJobs: "لا توجد وظائف منشورة حالياً.",
    noShifts: "لا توجد مناوبات متاحة حالياً.",
    reviews: (n: number) => `${n} تقييم`,
    noReviews: "لا تقييمات بعد",
    perHour: "/ساعة",
    type: "نوع المنشأة",
    location: "الموقع",
    online: "متصل الآن",
    offline: "غير متصل",
  },
  en: {
    home: "Home",
    crumb: "Facilities",
    back: "Back to jobs",
    hiddenTitle: "This employer's identity is hidden",
    hiddenBody:
      "Full employer details appear once your application is accepted or the employer contacts you — a privacy policy we apply to every employer.",
    browseJobs: "Browse jobs",
    verified: "Verified facility",
    unverified: "Pending verification",
    about: "About the facility",
    noAbout: "This facility hasn't added a description yet.",
    website: "Website",
    jobs: "Published jobs",
    shifts: "Open shifts",
    noJobs: "No published jobs right now.",
    noShifts: "No open shifts right now.",
    reviews: (n: number) => `${n} reviews`,
    noReviews: "No reviews yet",
    perHour: "/hour",
    type: "Facility type",
    location: "Location",
    online: "Online now",
    offline: "Offline",
  },
} as const;

export const Route = createFileRoute("/_public/facilities/$facilityId")({
  head: () => ({
    meta: [
      { title: "ملف المنشأة الصحية | Healthcare employer profile | SyndeoCare" },
      {
        name: "description",
        content: "تعرّف على المنشأة الصحية: نبذتها، توثيقها، تقييماتها، ووظائفها ومناوباتها المنشورة.",
      },
      { property: "og:title", content: "ملف المنشأة الصحية | Healthcare employer profile | SyndeoCare" },
      { property: "og:description", content: "ملف المنشأة الصحية ووظائفها المنشورة على SyndeoCare." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      NOINDEX,
    ],
  }),
  component: FacilityProfilePage,
});

function FacilityProfilePage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { facilityId } = Route.useParams();
  const { user } = useSession();
  const online = useOnlineUsers(user);

  const { data: facility, isLoading, isError: facErr, error: facErrObj, refetch: facRefetch } = useQuery({
    queryKey: ["public-facility", facilityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select(
          "id,user_id,name_ar,name_en,facility_type,country,city,description,website,logo_url,is_verified,rating_avg,rating_count",
        )
        .eq("id", facilityId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["public-facility-jobs", facilityId],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_jobs")
        .select("id,slug,title,city,country,salary_min,salary_max,currency")
        .eq("facility_id", facilityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string; slug: string | null; title: string; city: string; country: string;
        salary_min: number; salary_max: number; currency: string;
      }[];
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ["public-facility-shifts", facilityId],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_shifts")
        .select("id,title,starts_at,hourly_rate,currency,city,country,status")
        .eq("facility_id", facilityId)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string; title: string; starts_at: string; hourly_rate: number; currency: string;
        city: string; country: string; status: string;
      }[];
    },
  });

  // منع الوصول لهوية المنشأة ليس خطأ: اعرضه كحالة «الهوية محجوبة».
  const identityBlocked =
    !!facErr && ((facErrObj as { code?: string } | null)?.code === "42501" || (facErrObj as { code?: string } | null)?.code === "PGRST301");

  if (facErr && !identityBlocked)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <ErrorState error={facErrObj} onRetry={() => void facRefetch()} />
      </div>
    );

  if (isLoading && !identityBlocked)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );

  if (!facility)
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-lg bg-surface text-muted-foreground">
          <Lock className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">{c.hiddenTitle}</h1>
        <p className="mt-3 text-muted-foreground">{c.hiddenBody}</p>
        <Button className="mt-6" asChild>
          <Link to="/jobs">{c.browseJobs}</Link>
        </Button>
      </div>
    );

  const isOnline = facility.user_id ? online.has(facility.user_id) : false;

  return (
    <>
      <section className="page-hero py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-on-hero/70">
            <Link to="/" className="hover:text-on-hero">
              {c.home}
            </Link>
            <span>/</span>
            <span className="text-on-hero">{facility.name_ar}</span>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mt-3 text-on-hero/80 hover:bg-white/10 hover:text-on-hero"
          >
            <Link to="/jobs">
              <ArrowLeft className="size-4 rtl:rotate-180" /> {c.back}
            </Link>
          </Button>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="relative">
              <RemoteAvatar
                value={facility.logo_url}
                alt={facility.name_ar}
                icon={Building2}
                className="size-16 bg-white/12 text-on-hero ring-1 ring-white/20"
              />
              <span
                className={`absolute -bottom-0.5 -end-0.5 size-4 rounded-full border-2 border-transparent ${OnlineDotClass(isOnline)}`}
                title={isOnline ? c.online : c.offline}
              />
            </div>

            <div>
              <h1 className="font-display text-3xl font-extrabold md:text-4xl">
                {facility.name_ar}
              </h1>
              <p className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${isOnline ? "text-emerald-300" : "text-on-hero/60"}`}>
                <span className={`size-2 rounded-full ${OnlineDotClass(isOnline)}`} />
                {isOnline ? c.online : c.offline}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-on-hero/85">
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="size-4" /> {facility.city}،{" "}
                  {countryLabel(facility.country, lang)}
                </span>
                <Badge variant={facility.is_verified ? "secondary" : "outline"} className="gap-1">
                  <ShieldCheck className="size-3" />
                  {facility.is_verified ? c.verified : c.unverified}
                </Badge>
                <span className="flex items-center gap-1 text-sm">
                  <Star className="size-4" />
                  {facility.rating_count > 0
                    ? `${Number(facility.rating_avg).toFixed(1)} · ${c.reviews(facility.rating_count)}`
                    : c.noReviews}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <div className="card-lift rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold">{c.about}</h2>
          <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">
            {facility.description || c.noAbout}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-surface px-3 py-1">
              {c.type}: {facility.facility_type}
            </span>
            {facility.website && (
              <a
                href={facility.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary underline"
              >
                <Globe className="size-4" /> {c.website}
              </a>
            )}
          </div>
          {facility.rating_count > 0 && (
            <div className="mt-4">
              <RatingStars value={Number(facility.rating_avg)} />
            </div>
          )}
        </div>

        <div className="card-lift rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold">{c.jobs}</h2>
          {jobsPending ? (
            <div className="mt-4">
              <ListSkeleton rows={2} />
            </div>
          ) : jobsError ? (
            <ErrorState className="mt-4" onRetry={() => void refetchJobs()} />
          ) : jobs.length ? (
            <ul className="mt-4 space-y-3">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link
                    to="/jobs/$jobId"
                    params={{ jobId: j.slug ?? j.id }}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 hover:border-accent/50"
                  >
                    <div>
                      <p className="font-bold">{j.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {j.city}، {countryLabel(j.country, lang)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatSalary(Number(j.salary_min), Number(j.salary_max), j.currency, lang)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4" icon={Building2} title={c.noJobs} />
          )}
        </div>

        <div className="card-lift rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold">{c.shifts}</h2>
          {shiftsPending ? (
            <div className="mt-4">
              <ListSkeleton rows={2} />
            </div>
          ) : shiftsError ? (
            <ErrorState className="mt-4" onRetry={() => void refetchShifts()} />
          ) : shifts.length ? (
            <ul className="mt-4 space-y-3">
              {shifts.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/shifts/$shiftId"
                    params={{ shiftId: s.id }}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 hover:border-accent/50"
                  >
                    <div>
                      <p className="font-bold">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(s.starts_at, lang)} · {s.city}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-accent">
                      {formatMoney(Number(s.hourly_rate), s.currency, lang)}
                      {c.perHour}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4" icon={CalendarClock} title={c.noShifts} />
          )}
        </div>
      </div>
    </>
  );
}
