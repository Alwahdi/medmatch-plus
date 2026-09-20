import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    title: "التقديم متاح بعد توثيق حسابك",
    bodyProfile: "أكمل ملفك المهني وارفع مستنداتك ليراجعها فريق المنصة، ثم تستطيع التقديم والحجز.",
    bodyDocs: "ارفع مستنداتك (الرخصة والشهادات) ليراجعها فريق المنصة. بعد الاعتماد يمكنك التقديم والحجز.",
    ctaProfile: "أكمل ملفي المهني",
    ctaDocs: "ارفع مستنداتي",
  },
  en: {
    title: "Applying unlocks after verification",
    bodyProfile: "Complete your professional profile and upload your documents for review, then you can apply and book.",
    bodyDocs: "Upload your documents (license and certificates) for review. Once approved you can apply and book.",
    ctaProfile: "Complete my profile",
    ctaDocs: "Upload my documents",
  },
} as const;

/** إشعار موحّد يشرح سبب منع التقديم/الحجز ويوجّه للخطوة التالية. */
export function VerificationGateNotice({ hasProfile }: { hasProfile: boolean }) {
  const lang = useLang();
  const c = TXT[lang];
  return (
    <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
        <div>
          <p className="font-bold">{c.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{hasProfile ? c.bodyDocs : c.bodyProfile}</p>
        </div>
      </div>
      <Button className="mt-4 w-full" variant="secondary" asChild>
        <Link to="/profile" search={hasProfile ? { tab: "credentials" } : undefined}>
          {hasProfile ? c.ctaDocs : c.ctaProfile}
        </Link>
      </Button>
    </div>
  );
}
