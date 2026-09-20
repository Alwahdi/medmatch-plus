import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { engagementErrorText } from "@/lib/engagement-errors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ReportTargetType = "job" | "shift" | "conversation" | "message";

const CATEGORIES = [
  "misleading",
  "fraud_or_fee",
  "harassment",
  "privacy",
  "unsafe_content",
  "other",
] as const;

type Category = (typeof CATEGORIES)[number];

const TXT = {
  ar: {
    job: "الإبلاغ عن الوظيفة",
    shift: "الإبلاغ عن المناوبة",
    conversation: "الإبلاغ عن المحادثة",
    message: "الإبلاغ عن الرسالة",
    desc: "يصل بلاغك إلى فريق مراجعة SyndeoCare فقط، ولا يُعلم الطرف الآخر به.",
    reason: "سبب البلاغ",
    details: "تفاصيل إضافية (اختياري)",
    detailsPh: "اشرح باختصار ما المشكلة…",
    signIn: "سجّل الدخول للإبلاغ",
    cancel: "إلغاء",
    send: "إرسال البلاغ",
    sending: "جارٍ الإرسال…",
    done: "وصلنا بلاغك وسيراجعه الفريق.",
    counter: (n: number) => `${n}/1000`,
    cats: {
      misleading: "معلومات مضللة أو غير صحيحة",
      fraud_or_fee: "احتيال أو طلب رسوم",
      harassment: "تحرّش أو إساءة",
      privacy: "انتهاك خصوصية أو بيانات شخصية",
      unsafe_content: "محتوى غير لائق أو غير آمن",
      other: "سبب آخر",
    } as Record<Category, string>,
  },
  en: {
    job: "Report this job",
    shift: "Report this shift",
    conversation: "Report this conversation",
    message: "Report this message",
    desc: "Your report goes only to the SyndeoCare review team. The other party is not notified.",
    reason: "Reason",
    details: "More details (optional)",
    detailsPh: "Briefly describe the problem…",
    signIn: "Sign in to report",
    cancel: "Cancel",
    send: "Send report",
    sending: "Sending…",
    done: "We received your report. The team will review it.",
    counter: (n: number) => `${n}/1000`,
    cats: {
      misleading: "Misleading or inaccurate information",
      fraud_or_fee: "Fraud or a request for fees",
      harassment: "Harassment or abuse",
      privacy: "Privacy or personal data violation",
      unsafe_content: "Inappropriate or unsafe content",
      other: "Something else",
    } as Record<Category, string>,
  },
} as const;

export function ReportButton({
  targetType,
  targetId,
  label,
  className,
  iconOnly,
}: {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("misleading");
  const [details, setDetails] = useState("");

  const title = label ?? c[targetType];

  const submit = useMutation({
    mutationFn: async () => {
      const trimmed = details.trim();
      const { error } = await supabase.rpc("submit_safety_report", {
        _target_type: targetType,
        _target_id: targetId,
        _category: category,
        ...(trimmed ? { _details: trimmed } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      setDetails("");
      setCategory("misleading");
      toast.success(c.done);
    },
    onError: (err: unknown) => {
      const raw = err instanceof Error ? err.message : String(err);
      toast.error(engagementErrorText(raw, lang));
    },
  });

  if (!user) {
    if (iconOnly) return null;
    return (
      <Button variant="ghost" size="sm" asChild className={className}>
        <Link to="/auth">
          <Flag className="size-4" /> {c.signIn}
        </Link>
      </Button>
    );
  }

  return (
    <>
      {iconOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={title}
          title={title}
          className={`size-11 rounded-full ${className ?? ""}`}
          onClick={() => setOpen(true)}
        >
          <Flag className="size-5" />
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className={className} onClick={() => setOpen(true)}>
          <Flag className="size-4" /> {title}
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !submit.isPending && setOpen(v)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{c.desc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{c.reason}</Label>
              <RadioGroup
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
                className="gap-1"
              >
                {CATEGORIES.map((key) => (
                  <label
                    key={key}
                    htmlFor={`report-${key}`}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value={key} id={`report-${key}`} />
                    <span>{c.cats[key]}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-details">{c.details}</Label>
              <Textarea
                id="report-details"
                value={details}
                maxLength={1000}
                rows={4}
                placeholder={c.detailsPh}
                onChange={(e) => setDetails(e.target.value)}
              />
              <p className="text-end text-xs text-muted-foreground">{c.counter(details.length)}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submit.isPending}
            >
              {c.cancel}
            </Button>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
              {submit.isPending ? c.sending : c.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
