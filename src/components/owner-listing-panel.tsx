import { Link } from "@tanstack/react-router";
import { Building2, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    jobTitle: "هذه وظيفة نشرتها منشأتك",
    shiftTitle: "هذه مناوبة نشرتها منشأتك",
    sub: "أنت تشاهد الإعلان كما يراه الباحثون. الإدارة والمتقدمون داخل الإعلان نفسه في لوحة المنشأة.",
    manageJob: "إدارة هذه الوظيفة والمتقدمين",
    manageShift: "إدارة هذه المناوبة",
  },
  en: {
    jobTitle: "This job was published by your facility",
    shiftTitle: "This shift was published by your facility",
    sub: "You are viewing the listing as candidates see it. Manage it from your facility workspace.",
    manageJob: "Manage this job and its applicants",
    manageShift: "Manage this shift",
  },
} as const;

/** لوحة المالك: وجهة إدارة واحدة بدل روابط مكررة. */
export function OwnerListingPanel({ kind }: { kind: "job" | "shift" }) {
  const { lang } = useLang();
  const c = TXT[lang];
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Building2 className="size-5 text-primary" />
        {kind === "job" ? c.jobTitle : c.shiftTitle}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>
      <Button asChild className="mt-4 w-full">
        <Link to="/facility" search={{ tab: kind === "job" ? "jobs" : "shifts" }}>
          <Settings2 className="size-4" /> {kind === "job" ? c.manageJob : c.manageShift}
        </Link>
      </Button>
    </div>
  );
}
