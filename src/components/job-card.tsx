import { Link } from "@tanstack/react-router";
import { Building2, MapPin, Wallet, BriefcaseMedical } from "lucide-react";
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
      className="card-lift group block rounded-2xl border border-border bg-card p-5 hover:card-lift-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold group-hover:text-primary">{job.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-4" />
            {job.facilities?.name_ar}
            {job.facilities?.is_verified && (
              <Badge variant="secondary" className="text-[10px]">موثّقة</Badge>
            )}
          </p>
        </div>
        {typeof match === "number" && (
          <div className="shrink-0 rounded-xl bg-accent/12 px-3 py-2 text-center">
            <div className="text-lg font-bold text-accent">{match}%</div>
            <div className="text-[10px] text-muted-foreground">توافق</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1">
          <MapPin className="size-3" /> {job.city}، {job.country}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Wallet className="size-3" /> {formatSalary(job.salary_min, job.salary_max, job.currency)}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <BriefcaseMedical className="size-3" /> {EMPLOYMENT_LABELS[job.employment_type]}
        </Badge>
        {job.specialties && <Badge variant="outline">{job.specialties.name_ar}</Badge>}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>خبرة {job.min_experience}+ سنوات</span>
        <span>{relativeTime(job.created_at)}</span>
      </div>
    </Link>
  );
}
