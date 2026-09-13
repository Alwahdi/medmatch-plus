import { Link } from "@tanstack/react-router";
import { Building2, Pencil, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    jobTitle: "هذه وظيفة نشرتها منشأتك",
    shiftTitle: "هذه مناوبة نشرتها منشأتك",
    sub: "أنت تشاهد الآن الإعلان كما يراه الباحثون. يمكنك إدارة الإعلان ومراجعة المتقدمين من لوحة المنشأة.",
    applicants: "المتقدمون",
    manage: "إدارة الإعلان",
    profile: "ملف المنشأة",
  },
  en: {
    jobTitle: "This job was published by your facility",
    shiftTitle: "This shift was published by your facility",
    sub: "You are viewing the listing as candidates see it. Manage it and review applicants from your facility dashboard.",
    applicants: "Applicants",
    manage: "Manage listing",
    profile: "Facility profile",
  },
} as const;

/** لوحة المالك: تظهر لصاحب الإعلان بدل نموذج التقديم/الحجز. */
export function OwnerListingPanel({ kind }: { kind: "job" | "shift" }) {
  const { lang } = useLang();
  const c = TXT[lang];
  return (
    <div className="card-lift rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Building2 className="size-5 text-primary" />
        {kind === "job" ? c.jobTitle : c.shiftTitle}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>
      <div className="mt-4 grid gap-2">
        <Button asChild className="w-full">
          <Link to="/facility/applicants">
            <Users className="size-4" /> {c.applicants}
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link to="/facility">
            <Pencil className="size-4" /> {c.manage}
          </Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/facility/profile">
            <Building2 className="size-4" /> {c.profile}
          </Link>
        </Button>
      </div>
    </div>
  );
}
