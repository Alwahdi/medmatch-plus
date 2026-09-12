import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin, BriefcaseMedical, Clock3, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  countryLabel,
  employmentLabel,
  formatSalary,
  relativeTime,
  specialtyName,
} from "@/lib/format";
import { useLang } from "@/lib/i18n";

export type JobRow = {
  id: string;
  slug?: string | null;
  title: string;
  country: string;
  city: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  employment_type: string;
  min_experience: number;
  created_at: string;
  expires_at?: string | null;
  is_featured?: boolean | null;
  facility_verified?: boolean | null;
  applications_count?: number | null;
  specialties: { name_ar: string; name_en?: string | null } | null;
};

const DAY = 86400000;

const TXT = {
  ar: {
    featured: "مميّزة",
    isNew: "جديدة",
    closing: "تغلق قريباً",
    verified: "ناشر موثّق",
    match: "توافق",
    salary: "الراتب الشهري",
    exp: (n: number) => `خبرة ${n}+ سنوات`,
    applied: (n: number) => `تقدّم ${n}`,
    details: "التفاصيل",
  },
  en: {
    featured: "Featured",
    isNew: "New",
    closing: "Closing soon",
    verified: "Verified employer",
    match: "Match",
    salary: "Monthly salary",
    exp: (n: number) => `${n}+ years experience`,
    applied: (n: number) => `${n} applied`,
    details: "View details",
  },
} as const;

export function JobCard({ job, match }: { job: JobRow; match?: number | null }) {
  const { lang } = useLang();
  const c = TXT[lang];
  const isNew = Date.now() - new Date(job.created_at).getTime() < 2 * DAY;
  const closingSoon =
    !!job.expires_at && new Date(job.expires_at).getTime() - Date.now() < 5 * DAY;

  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.slug ?? job.id }}
      className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-card p-5 hover:border-accent/30"
    >
      <div className="flex flex-wrap items-center gap-2">
        {job.is_featured && <Badge className="bg-primary text-primary-foreground">{c.featured}</Badge>}
        {isNew && <Badge className="bg-accent/15 text-accent hover:bg-accent/20">{c.isNew}</Badge>}
        {closingSoon && !isNew && <Badge variant="destructive">{c.closing}</Badge>}
        {job.facility_verified && (
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="size-3" /> {c.verified}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug font-bold group-hover:text-primary">
          {job.title}
        </h3>
        {typeof match === "number" && (
          <div className="shrink-0 rounded-xl bg-accent/12 px-3 py-2 text-center">
            <div className="font-display text-lg font-bold text-accent">{match}%</div>
            <div className="text-[10px] text-muted-foreground">{c.match}</div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-surface px-4 py-3">
        <div className="text-[11px] text-muted-foreground">{c.salary}</div>
        <div className="font-display text-lg font-extrabold text-primary">
          {formatSalary(job.salary_min, job.salary_max, job.currency, lang)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1">
          <MapPin className="size-3" /> {job.city}، {countryLabel(job.country, lang)}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <BriefcaseMedical className="size-3" /> {employmentLabel(job.employment_type, lang)}
        </Badge>
        {job.specialties && <Badge variant="outline">{specialtyName(job.specialties, lang)}</Badge>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> {c.exp(job.min_experience)} ·{" "}
            {relativeTime(job.created_at, lang)}
          </span>
          {!!job.applications_count && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {c.applied(job.applications_count)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {c.details} <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
