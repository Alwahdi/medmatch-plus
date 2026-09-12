import { Link } from "@tanstack/react-router";
import { ArrowLeft, MapPin, BriefcaseMedical, Clock3, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EMPLOYMENT_LABELS, formatSalary, relativeTime } from "@/lib/format";

export type JobRow = {
  id: string;
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
  specialties: { name_ar: string } | null;
};

const DAY = 86400000;

export function JobCard({ job, match }: { job: JobRow; match?: number | null }) {
  const isNew = Date.now() - new Date(job.created_at).getTime() < 2 * DAY;
  const closingSoon =
    !!job.expires_at && new Date(job.expires_at).getTime() - Date.now() < 5 * DAY;

  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        {job.is_featured && (
          <Badge className="bg-primary text-primary-foreground">مميّزة</Badge>
        )}
        {isNew && <Badge className="bg-accent/15 text-accent hover:bg-accent/20">جديدة</Badge>}
        {closingSoon && !isNew && <Badge variant="destructive">تغلق قريباً</Badge>}
        {job.facility_verified && (
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="size-3" /> ناشر موثّق
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
            <div className="text-[10px] text-muted-foreground">توافق</div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-surface px-4 py-3">
        <div className="text-[11px] text-muted-foreground">الراتب الشهري</div>
        <div className="font-display text-lg font-extrabold text-primary">
          {formatSalary(job.salary_min, job.salary_max, job.currency)}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1">
          <MapPin className="size-3" /> {job.city}، {job.country}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <BriefcaseMedical className="size-3" /> {EMPLOYMENT_LABELS[job.employment_type]}
        </Badge>
        {job.specialties && <Badge variant="outline">{job.specialties.name_ar}</Badge>}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> خبرة {job.min_experience}+ سنوات ·{" "}
            {relativeTime(job.created_at)}
          </span>
          {!!job.applications_count && (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> تقدّم {job.applications_count}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          التفاصيل <ArrowLeft className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
