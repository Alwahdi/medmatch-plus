import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileText, ShieldOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Lang } from "@/lib/i18n";

export type DocState = "approved" | "pending" | "rejected" | "missing";

export type RequiredDoc = { label: string; state: DocState };

const COPY = {
  ar: {
    checklist: "المستندات المطلوبة للتوثيق",
    approved: "معتمد",
    pending: "قيد المراجعة",
    rejected: "مرفوض",
    missing: "لم يُرفع",
    autoNote: "يُمنح التوثيق تلقائياً فور اعتماد كل المستندات المطلوبة — لا يمكن منحه يدوياً.",
    reviewDocs: "مراجعة المستندات",
    revoke: "سحب التوثيق",
    revokeTitle: "سحب التوثيق إجراء استثنائي",
    revokeBody:
      "يُستخدم فقط لأسباب تتعلق بالثقة والسلامة. بعد السحب تبقى الشارة موقوفة حتى استعادتها يدوياً، حتى لو أُعيد رفع المستندات أو اعتمادها.",
    reasonLabel: "سبب السحب (إلزامي)",
    reasonPlaceholder: "مثال: بلاغ موثّق بانتحال هوية المنشأة",
    confirmRevoke: "تأكيد السحب",
    cancel: "إلغاء",
    suspended: "التوثيق موقوف إدارياً",
    restore: "استعادة التوثيق",
    restoreBlocked: "لا يمكن الاستعادة: المستندات المطلوبة غير معتمدة حالياً.",
  },
  en: {
    checklist: "Documents required for verification",
    approved: "Approved",
    pending: "Under review",
    rejected: "Rejected",
    missing: "Not uploaded",
    autoNote:
      "Verification is granted automatically once every required document is approved — it cannot be granted manually.",
    reviewDocs: "Review documents",
    revoke: "Remove verification",
    revokeTitle: "Removing verification is an exceptional action",
    revokeBody:
      "Use it only for trust and safety reasons. The badge stays suspended until an admin restores it, even if documents are re-uploaded or re-approved.",
    reasonLabel: "Reason (required)",
    reasonPlaceholder: "e.g. confirmed report of facility identity misuse",
    confirmRevoke: "Confirm removal",
    cancel: "Cancel",
    suspended: "Verification suspended by an admin",
    restore: "Restore verification",
    restoreBlocked: "Cannot restore: the required documents are not currently approved.",
  },
} as const;

function StateChip({ doc, lang }: { doc: RequiredDoc; lang: Lang }) {
  const t = COPY[lang];
  const map = {
    approved: { icon: CheckCircle2, cls: "text-accent", label: t.approved },
    pending: { icon: Clock, cls: "text-muted-foreground", label: t.pending },
    rejected: { icon: XCircle, cls: "text-destructive", label: t.rejected },
    missing: { icon: AlertTriangle, cls: "text-muted-foreground", label: t.missing },
  } as const;
  const { icon: Icon, cls, label } = map[doc.state];
  return (
    <li className="flex items-center gap-2 text-xs">
      <Icon className={`size-3.5 shrink-0 ${cls}`} aria-hidden />
      <span className="font-medium">{doc.label}</span>
      <span className={`text-muted-foreground ${cls}`}>· {label}</span>
    </li>
  );
}

export function VerificationPanel({
  lang,
  verified,
  suspended,
  suspensionReason,
  docs,
  pending,
  onRevoke,
  onRestore,
  onReviewDocs,
}: {
  lang: Lang;
  verified: boolean;
  suspended: boolean;
  suspensionReason: string | null;
  docs: RequiredDoc[];
  pending: boolean;
  onRevoke: (reason: string) => void;
  onRestore: () => void;
  onReviewDocs: () => void;
}) {
  const t = COPY[lang];
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const evidenceOk = docs.every((d) => d.state === "approved");

  return (
    <div className="w-full space-y-3 border-t border-border pt-3">
      <div>
        <p className="text-xs font-semibold">{t.checklist}</p>
        <ul className="mt-1.5 space-y-1">
          {docs.map((d) => (
            <StateChip key={d.label} doc={d} lang={lang} />
          ))}
        </ul>
      </div>

      {suspended && (
        <p className="flex items-start gap-2 rounded-md bg-muted p-2 text-xs">
          <ShieldOff className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
          <span>
            <span className="font-medium">{t.suspended}</span>
            {suspensionReason ? ` — ${suspensionReason}` : ""}
          </span>
        </p>
      )}

      {!verified && <p className="text-xs text-muted-foreground">{t.autoNote}</p>}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="min-h-11" onClick={onReviewDocs}>
          <FileText className="size-4" aria-hidden />
          {t.reviewDocs}
        </Button>

        {verified && !open && (
          <Button size="sm" variant="outline" className="min-h-11" onClick={() => setOpen(true)}>
            {t.revoke}
          </Button>
        )}

        {!verified && suspended && (
          <Button
            size="sm"
            className="min-h-11"
            loading={pending}
            disabled={!evidenceOk}
            onClick={onRestore}
          >
            {t.restore}
          </Button>
        )}
      </div>

      {!verified && suspended && !evidenceOk && (
        <p className="text-xs text-muted-foreground">{t.restoreBlocked}</p>
      )}

      {verified && open && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-xs font-semibold">{t.revokeTitle}</p>
          <p className="text-xs text-muted-foreground">{t.revokeBody}</p>
          <label className="block text-xs font-medium" htmlFor="revoke-reason">
            {t.reasonLabel}
          </label>
          <Textarea
            id="revoke-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t.reasonPlaceholder}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="destructive"
              className="min-h-11"
              loading={pending}
              disabled={reason.trim().length < 3}
              onClick={() => {
                onRevoke(reason.trim());
                setReason("");
                setOpen(false);
              }}
            >
              {t.confirmRevoke}
            </Button>
            <Button size="sm" variant="ghost" className="min-h-11" onClick={() => setOpen(false)}>
              {t.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
