import { Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, MapPin, BriefcaseMedical, Clock3 } from "lucide-react";
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
  facilities: { name_ar: string; is_verified: boolean } | null;
  specialties: { name_ar: string } | null;
};

export function JobCard({ job, match }: { job: JobRow; match?: number | null }) {
  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug font-bold group-hover:text-primary">
            {job.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">{job.facilities?.name_ar}</span>
            {job.facilities?.is_verified && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                موثّقة
              </Badge>
            )}
          </div>
        </div>
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

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock3 className="size-3.5" /> خبرة {job.min_experience}+ سنوات · {relativeTime(job.created_at)}
        </span>
        <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          التفاصيل <ArrowLeft className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}
