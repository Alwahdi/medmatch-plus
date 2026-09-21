import { useCallback, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n";
import {
  type LegalKey,
  hasConsent,
  legalBody,
  useLegalDocuments,
  useMyConsents,
  useRecordConsent,
} from "@/lib/legal";

const TXT = {
  ar: {
    applyTitle: "قبل إرسال طلبك",
    publishTitle: "قبل نشر الفرصة",
    intro: "يرجى قراءة الالتزامات التالية والموافقة عليها للمتابعة. تُسجَّل موافقتك مرة واحدة.",
    agree: "أوافق على الشروط وسياسة الخصوصية والالتزامات أعلاه",
    confirm: "أوافق وأتابع",
    cancel: "إلغاء",
    terms: "الشروط والأحكام",
    privacy: "سياسة الخصوصية",
    failed: "تعذّر تسجيل الموافقة، حاول مرة أخرى.",
    applicantDefault: [
      "المعلومات التي قدّمتها في ملفك ووثائقك صحيحة وتخصّك أنت.",
      "توافق على مشاركة ملفك المهني وبيانات تواصلك مع المنشأة التي تقدّمت إليها لغرض التوظيف فقط.",
      "تلتزم بالتعامل المهني والردّ على المنشأة، وإبلاغها فوراً عند تعذّر الاستمرار.",
      "أي انتحال صفة أو وثيقة غير صحيحة يؤدي إلى إيقاف الحساب.",
    ],
    publisherDefault: [
      "الفرصة التي تنشرها حقيقية وتمثّل منشأتك، وبياناتها (المكان، الأجر، المتطلبات) دقيقة.",
      "تلتزم بالتعامل مع بيانات المتقدمين بسرّية ولغرض التوظيف فقط، وعدم مشاركتها خارج منشأتك.",
      "تلتزم بالرد على المتقدمين وتحديث حالة الفرصة عند اكتمالها أو إلغائها.",
      "يُمنع نشر فرص وهمية أو طلب أي مبالغ مالية من المتقدمين.",
    ],
  },
  en: {
    applyTitle: "Before you apply",
    publishTitle: "Before you publish",
    intro: "Please read and accept the commitments below to continue. Your consent is recorded once.",
    agree: "I accept the terms, privacy policy and the commitments above",
    confirm: "Accept and continue",
    cancel: "Cancel",
    terms: "Terms",
    privacy: "Privacy policy",
    failed: "Could not record your consent. Please try again.",
    applicantDefault: [
      "The information in your profile and documents is accurate and belongs to you.",
      "You agree to share your professional profile and contact details with the facility you apply to, for hiring purposes only.",
      "You commit to professional conduct, responding to the facility, and informing it promptly if you can no longer continue.",
      "Impersonation or false documents lead to account suspension.",
    ],
    publisherDefault: [
      "The opportunity you publish is real, represents your facility, and its details (location, pay, requirements) are accurate.",
      "You will treat applicant data confidentially, use it for hiring only, and not share it outside your facility.",
      "You will respond to applicants and keep the opportunity status up to date when filled or cancelled.",
      "Fake opportunities and requesting money from applicants are strictly prohibited.",
    ],
  },
} as const;

export type ConsentGate = {
  ensure: () => Promise<boolean>;
  node: React.ReactNode;
};

/**
 * بوابة الموافقة: تعرض الالتزامات وسياسة الخصوصية والشروط قبل التقديم أو النشر،
 * وتسجّل الموافقة مرة واحدة لكل إصدار من النص.
 */
export function useConsentGate(key: Extract<LegalKey, "applicant_commitments" | "publisher_commitments">): ConsentGate {
  const { lang } = useLang();
  const c = TXT[lang];
  const { data: docs } = useLegalDocuments();
  const { data: consents } = useMyConsents();
  const record = useRecordConsent();

  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const done = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpen(false);
    setChecked(false);
  }, []);

  const ensure = useCallback(() => {
    if (hasConsent(consents, docs, key)) return Promise.resolve(true);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, [consents, docs, key]);

  const doc = docs?.find((d) => d.key === key) ?? null;
  const custom = legalBody(doc, lang);
  const lines = custom
    ? custom.split("\n").map((l) => l.trim()).filter(Boolean)
    : key === "applicant_commitments"
      ? [...c.applicantDefault]
      : [...c.publisherDefault];

  const node = (
    <Dialog open={open} onOpenChange={(v) => { if (!v) done(false); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            {key === "applicant_commitments" ? c.applyTitle : c.publishTitle}
          </DialogTitle>
          <DialogDescription>{c.intro}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/terms" target="_blank" className="text-primary underline underline-offset-4">
            {c.terms}
          </Link>
          <Link to="/privacy" target="_blank" className="text-primary underline underline-offset-4">
            {c.privacy}
          </Link>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
          <Checkbox
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
            aria-label={c.agree}
          />
          <span>{c.agree}</span>
        </label>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => done(false)}>
            {c.cancel}
          </Button>
          <Button
            disabled={!checked || record.isPending}
            onClick={async () => {
              try {
                await record.mutateAsync(key);
                done(true);
              } catch {
                toast.error(c.failed);
              }
            }}
          >
            {record.isPending && <Loader2 className="size-4 animate-spin" />}
            {c.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { ensure, node };
}
