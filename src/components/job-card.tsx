import { Link } from "@tanstack/react-router";
import { Bookmark, Building2, CheckCircle2, Clock3, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import {
  countryLabel,
  employmentLabel,
  formatSalary,
  relativeTime,
  specialtyName,
} from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { WorkTypeBadge } from "@/components/work-item";

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
    closing: "يغلق قريباً",
    verified: "موثّق",
    applied: "قدّمت عليها",
    saved: "محفوظة",
    recommended: "يناسبك",
  },
  en: {
    featured: "Featured",
    isNew: "New",
    closing: "Closing soon",
    verified: "Verified",
    applied: "Applied",
    saved: "Saved",
    recommended: "Recommended",
  },
} as const;

export function JobCard({
  job,
  applied,
  saved,
  recommended,
}: {
  job: JobRow;
  applied?: boolean;
  saved?: boolean;
  recommended?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const isNew = Date.now() - new Date(job.created_at).getTime() < 2 * DAY;
  const closingSoon =
    !!job.expires_at && new Date(job.expires_at).getTime() - Date.now() < 5 * DAY;

  const ribbon = job.is_featured
    ? { label: c.featured, cls: "bg-primary text-primary-foreground" }
    : closingSoon
      ? { label: c.closing, cls: "bg-warning text-warning-foreground" }
      : isNew
        ? { label: c.isNew, cls: "bg-success text-success-foreground" }
        : null;


  return (
    <div className="relative pt-2">
      {ribbon && (
        <span
          className={`absolute top-0 z-10 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${ribbon.cls} start-4`}
        >
          {ribbon.label}
        </span>
      )}
      <Link
        to="/jobs/$jobId"
        params={{ jobId: job.slug ?? job.id }}
        className="card-lift group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:border-accent/40 sm:p-5"
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground sm:size-14">
          <Building2 className="size-6" />
        </div>

        <div className="min-w-0 flex-1">
          <WorkTypeBadge type="job" />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <h3 className="font-display text-base leading-snug font-bold group-hover:text-primary sm:text-lg">
              {job.title}
            </h3>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {employmentLabel(job.employment_type, lang)}
            </span>
            {job.specialties && (
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs">
                {specialtyName(job.specialties, lang)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {countryLabel(job.country, lang)}، {job.city}
            </span>
            {job.facility_verified && (
              <span className="flex items-center gap-1 text-xs text-accent">
                <ShieldCheck className="size-3.5" /> {c.verified}
              </span>
            )}
            {recommended && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" /> {c.recommended}
              </span>
            )}
            {applied && (
              <span className="flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-semibold text-success">
                <CheckCircle2 className="size-3.5" /> {c.applied}
              </span>
            )}
            {saved && (
              <span className="flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold">
                <Bookmark className="size-3.5" /> {c.saved}
              </span>
            )}
          </div>


          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" /> {relativeTime(job.created_at, lang)}
            </span>
            <span className="font-display font-bold text-primary">
              {formatSalary(job.salary_min, job.salary_max, job.currency, lang)}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
