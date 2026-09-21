import { Link } from "@tanstack/react-router";
import { Building2, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FacilityApplicantsPanel } from "@/components/panels/facility.applicants";
import { FacilityBookingsPanel } from "@/components/panels/facility.bookings";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    jobTitle: "هذه وظيفة نشرتها منشأتك",
    shiftTitle: "هذه مناوبة نشرتها منشأتك",
    sub: "أنت تشاهد الفرصة كمالكها، مع قائمة من تقدّم أو حجز لها.",
    manageJob: "إدارة هذه الوظيفة",
    manageShift: "إدارة هذه المناوبة",
    applicants: "المتقدمون لهذه الوظيفة",
    bookings: "حجوزات هذه المناوبة",
  },
  en: {
    jobTitle: "This job was published by your facility",
    shiftTitle: "This shift was published by your facility",
    sub: "You are viewing this opportunity as its owner, together with who applied or booked.",
    manageJob: "Manage this job",
    manageShift: "Manage this shift",
    applicants: "Applicants for this job",
    bookings: "Bookings for this shift",
  },
} as const;

/** قسم المالك على صفحة الإعلان: بعرض كامل — الإدارة + من تقدّم/حجز لهذه الفرصة تحديداً. */
export function OwnerListingPanel({
  kind,
  listingId,
  facilityId,
  completed = false,
}: {
  kind: "job" | "shift";
  listingId?: string;
  facilityId?: string;
  completed?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const isJob = kind === "job";
  return (
    <section className="rounded-lg border border-primary/30 bg-primary/5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Building2 className="size-5 text-primary" />
            {isJob ? c.jobTitle : c.shiftTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/facility" search={{ tab: isJob ? "jobs" : "shifts" }}>
            <Settings2 className="size-4" /> {isJob ? c.manageJob : c.manageShift}
          </Link>
        </Button>
      </div>

      {listingId && (
        <div className="mt-6 border-t border-primary/20 pt-4">
          <h3 className="mb-3 text-sm font-bold">{isJob ? c.applicants : c.bookings}</h3>
          {isJob ? (
            <FacilityApplicantsPanel jobId={listingId} embedded />
          ) : facilityId ? (
            <FacilityBookingsPanel shiftId={listingId} facilityId={facilityId} shiftCompleted={completed} />
          ) : null}
        </div>
      )}
    </section>
  );
}
