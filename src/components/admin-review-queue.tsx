import { useState } from "react";
import { CheckCircle2, ChevronLeft, FileText, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { RequiredDoc } from "@/components/admin-verification";
import { formatDate } from "@/lib/format";
import { VALIDITY_TXT, isExpired } from "@/lib/doc-validity";
import type { Lang } from "@/lib/i18n";

/** مستند واحد كما يراه المراجع الإداري (وثيقة كادر أو مستند منشأة). */
export type ReviewDoc = {
  id: string;
  doc_type: string;
  title: string;
  file_name?: string | null;
  issuer?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  status: string;
  review_note?: string | null;
  file_path?: string | null;
  created_at: string;
};

/** جهة واحدة (منشأة أو كادر) بملفها ومستنداتها. */
export type ReviewOwner = {
  key: string;
  name: string;
  meta: string;
  verified: boolean;
  details: { label: string; value: string }[];
  docs: ReviewDoc[];
  required: RequiredDoc[];
};

const COPY = {
  ar: {
    pendingCount: (n: number) => `${n} قيد المراجعة`,
    noPending: "لا مستندات قيد المراجعة",
    approveAll: (n: number) => `اعتماد الكل (${n})`,
    openProfile: "عرض الملف",
    view: "عرض المستند",
    approve: "اعتماد",
    reject: "رفض",
    verified: "موثّق",
    notVerified: "غير موثّق",
    docsTitle: "المستندات",
    requiredTitle: "المستندات المطلوبة للتوثيق",
    fileLabel: "الملف",
    issued: (d: string) => `صدر ${d}`,
    expires: (d: string) => `ينتهي ${d}`,
    noteLabel: "سبب الرفض (يظهر لصاحب المستند)",
    notePlaceholder: "مثال: صورة المستند غير واضحة، أعد رفعها بجودة أعلى.",
    confirmTitle: "اعتماد كل المستندات؟",
    confirmBody: (name: string, n: number) =>
      `سيتم اعتماد ${n} مستنداً قيد المراجعة لـ«${name}». يمكن التراجع لاحقاً برفض أي مستند.`,
    confirmOk: "اعتماد",
    cancel: "إلغاء",
    stateApproved: "معتمد",
    statePending: "قيد المراجعة",
    stateRejected: "مرفوض",
    stateMissing: "لم يُرفع",
    stateExpired: "منتهي الصلاحية",
  },
  en: {
    pendingCount: (n: number) => `${n} pending`,
    noPending: "No documents pending",
    approveAll: (n: number) => `Approve all (${n})`,
    openProfile: "Open profile",
    view: "View document",
    approve: "Approve",
    reject: "Reject",
    verified: "Verified",
    notVerified: "Not verified",
    docsTitle: "Documents",
    requiredTitle: "Documents required for verification",
    fileLabel: "File",
    issued: (d: string) => `Issued ${d}`,
    expires: (d: string) => `Expires ${d}`,
    noteLabel: "Rejection reason (shown to the owner)",
    notePlaceholder: "e.g. the scan is unreadable, please upload a clearer copy.",
    confirmTitle: "Approve all documents?",
    confirmBody: (name: string, n: number) =>
      `This approves ${n} pending document(s) for "${name}". You can still reject any of them afterwards.`,
    confirmOk: "Approve",
    cancel: "Cancel",
    stateApproved: "Approved",
    statePending: "Under review",
    stateRejected: "Rejected",
    stateMissing: "Not uploaded",
    stateExpired: "Expired",
  },
} as const;

function statusVariant(status: string) {
  return status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary";
}

type Props = {
  lang: Lang;
  owners: ReviewOwner[];
  /** اسم النوع الرسمي للمستند (يُستخدم كعنوان بدل النص الحر). */
  docLabel: (docType: string) => string;
  statusLabel: (status: string) => string;
  onOpenFile: (path: string | null) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, note: string) => void;
  onApproveAll: (owner: ReviewOwner, ids: string[]) => void;
  reviewPending: boolean;
  bulkPendingKey?: string | null;
  autoVerifyNote: string;
};

export function AdminReviewQueue({
  lang,
  owners,
  docLabel,
  statusLabel,
  onOpenFile,
  onApprove,
  onReject,
  onApproveAll,
  reviewPending,
  bulkPendingKey,
  autoVerifyNote,
}: Props) {
  const t = COPY[lang];
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const open = owners.find((o) => o.key === openKey) ?? null;
  const confirmOwner = owners.find((o) => o.key === confirmKey) ?? null;
  const pendingIds = (o: ReviewOwner) => o.docs.filter((d) => d.status === "pending").map((d) => d.id);

  const stateText: Record<RequiredDoc["state"], string> = {
    approved: t.stateApproved,
    pending: t.statePending,
    rejected: t.stateRejected,
    missing: t.stateMissing,
    expired: t.stateExpired,
  };

  return (
    <>
      <ul className="mt-4 space-y-3">
        {owners.map((owner) => {
          const ids = pendingIds(owner);
          return (
            <li key={owner.key} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-bold">
                    <span className="truncate">{owner.name}</span>
                    {owner.verified && <ShieldCheck className="size-4 shrink-0 text-accent" aria-label={t.verified} />}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{owner.meta}</p>
                </div>
                <Badge variant={ids.length ? "secondary" : "outline"} className="shrink-0">
                  {ids.length ? t.pendingCount(ids.length) : t.noPending}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                {ids.length > 0 && (
                  <Button
                    size="sm"
                    loading={bulkPendingKey === owner.key}
                    disabled={!!bulkPendingKey}
                    onClick={() => setConfirmKey(owner.key)}
                  >
                    <CheckCircle2 className="size-4" /> {t.approveAll(ids.length)}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setOpenKey(owner.key)}>
                  <ChevronLeft className="size-4 rtl:rotate-180" /> {t.openProfile}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Sheet
        open={!!open}
        onOpenChange={(v) => {
          if (!v) {
            setOpenKey(null);
            setRejectId(null);
            setNote("");
          }
        }}
      >
        <SheetContent side="bottom" className="h-[88vh] overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)] sm:p-6">
          {open && (
            <>
              <SheetHeader className="text-start">
                <SheetTitle className="flex items-center gap-2">
                  <span className="truncate">{open.name}</span>
                  <Badge variant={open.verified ? "default" : "outline"}>
                    {open.verified ? t.verified : t.notVerified}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-start">{open.meta}</SheetDescription>
              </SheetHeader>

              {open.details.length > 0 && (
                <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:grid-cols-2">
                  {open.details.map((d) => (
                    <div key={d.label} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{d.label}</dt>
                      <dd className="text-end font-medium">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <section className="mt-5">
                <h3 className="text-sm font-bold">{t.requiredTitle}</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {open.required.map((r) => (
                    <li key={r.label} className="flex items-center justify-between gap-3">
                      <span>{r.label}</span>
                      <Badge
                        variant={
                          r.state === "approved" ? "default" : r.state === "pending" ? "secondary" : "destructive"
                        }
                      >
                        {stateText[r.state]}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">{autoVerifyNote}</p>
              </section>

              <section className="mt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold">{t.docsTitle}</h3>
                  {pendingIds(open).length > 0 && (
                    <Button
                      size="sm"
                      className="ms-auto"
                      loading={bulkPendingKey === open.key}
                      disabled={!!bulkPendingKey}
                      onClick={() => setConfirmKey(open.key)}
                    >
                      <CheckCircle2 className="size-4" /> {t.approveAll(pendingIds(open).length)}
                    </Button>
                  )}
                </div>
                <ul className="mt-3 space-y-3">
                  {open.docs.map((doc) => (
                    <li key={doc.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold">{docLabel(doc.doc_type)}</p>
                          {(doc.file_name || doc.title) && (
                            <p className="mt-1 break-all text-xs text-muted-foreground">
                              {t.fileLabel}: {doc.file_name || doc.title}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {doc.issuer ? `${doc.issuer} · ` : ""}
                            {doc.issue_date ? `${t.issued(formatDate(doc.issue_date, lang))} · ` : ""}
                            {doc.expiry_date ? `${t.expires(formatDate(doc.expiry_date, lang))} · ` : ""}
                            {formatDate(doc.created_at, lang)}
                          </p>
                          {doc.review_note && (
                            <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                              {doc.review_note}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {isExpired(doc.expiry_date ?? null) && (
                            <Badge variant="destructive">{VALIDITY_TXT[lang].expired}</Badge>
                          )}
                          <Badge variant={statusVariant(doc.status)}>{statusLabel(doc.status)}</Badge>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => onOpenFile(doc.file_path ?? null)}>
                          <FileText className="size-4" /> {t.view}
                        </Button>
                        {doc.status !== "approved" && (
                          <Button size="sm" loading={reviewPending} onClick={() => onApprove(doc.id)}>
                            <CheckCircle2 className="size-4" /> {t.approve}
                          </Button>
                        )}
                        {doc.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejectId(rejectId === doc.id ? null : doc.id);
                              setNote(doc.review_note ?? "");
                            }}
                          >
                            <XCircle className="size-4" /> {t.reject}
                          </Button>
                        )}
                      </div>
                      {rejectId === doc.id && (
                        <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                          <label className="text-xs font-medium" htmlFor={`rn-${doc.id}`}>
                            {t.noteLabel}
                          </label>
                          <Textarea
                            id={`rn-${doc.id}`}
                            rows={2}
                            className="mt-2 bg-background"
                            value={note}
                            placeholder={t.notePlaceholder}
                            onChange={(e) => setNote(e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="mt-2"
                            loading={reviewPending}
                            onClick={() => {
                              onReject(doc.id, note.trim());
                              setRejectId(null);
                              setNote("");
                            }}
                          >
                            {t.reject}
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmOwner} onOpenChange={(v) => !v && setConfirmKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmOwner ? t.confirmBody(confirmOwner.name, pendingIds(confirmOwner).length) : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmOwner) onApproveAll(confirmOwner, pendingIds(confirmOwner));
                setConfirmKey(null);
              }}
            >
              {t.confirmOk}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
