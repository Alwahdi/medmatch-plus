import {
  CheckCircle2,
  Clock,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { credentialLabel, formatDate } from "@/lib/format";
import { reqName, reqNote, type DocRequirement } from "@/lib/document-requirements";
import { VALIDITY_TXT, isExpired, isExpiringSoon } from "@/lib/doc-validity";
import { useLang } from "@/lib/i18n";

export type DocRow = {
  id: string;
  doc_type: string;
  title: string;
  file_name: string | null;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  file_path: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
};

const TXT = {
  ar: {
    required: "مطلوبة",
    optional: "اختيارية",
    missing: "لم تُرفع",
    upload: "ارفع الملف",
    addMore: "أضف ملفاً آخر",
    replace: "استبدال",
    view: "عرض",
    delete: "حذف الوثيقة",
    counter: (a: number, b: number) => `رفعت ${a} من ${b}`,
    uploadedOn: (d: string) => `رُفع ${d}`,
    expiry: "تاريخ الانتهاء",
    issuer: "الجهة المُصدِرة",
  },
  en: {
    required: "Required",
    optional: "Optional",
    missing: "Not uploaded",
    upload: "Upload file",
    addMore: "Add another file",
    replace: "Replace",
    view: "View",
    delete: "Delete document",
    counter: (a: number, b: number) => `${a} of ${b} uploaded`,
    uploadedOn: (d: string) => `Uploaded ${d}`,
    expiry: "Expiry date",
    issuer: "Issuing authority",
  },
} as const;

type Props = {
  requirement: DocRequirement;
  docs: DocRow[];
  anchorPrefix: "cred" | "doc";
  onUpload: () => void;
  onView: (path: string | null) => void;
  onDelete: (doc: DocRow) => void;
};

/** بطاقة وثيقة مطلوبة: حالتها وملفاتها والرفع من داخلها مباشرة. */
export function DocumentRequirementCard({
  requirement: r,
  docs,
  anchorPrefix,
  onUpload,
  onView,
  onDelete,
}: Props) {
  const { lang } = useLang();
  const c = TXT[lang];
  const v = VALIDITY_TXT[lang];
  const note = reqNote(r, lang);
  const top = docs[0];
  const expiredDoc = !!top && top.status === "approved" && isExpired(top.expiry_date);
  const Icon = expiredDoc
    ? ShieldAlert
    : top?.status === "approved"
      ? CheckCircle2
      : top?.status === "rejected"
        ? XCircle
        : top
          ? Clock
          : ShieldCheck;
  const tone =
    expiredDoc || top?.status === "rejected"
      ? "text-destructive"
      : top?.status === "approved"
        ? "text-accent"
        : "text-muted-foreground";

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 ${tone}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{reqName(r, lang)}</p>
            <Badge variant={r.is_required ? "secondary" : "outline"} className="shrink-0">
              {r.is_required ? c.required : c.optional}
            </Badge>
            <span className={`text-xs ${expiredDoc ? "text-destructive" : "text-muted-foreground"}`}>
              {expiredDoc ? v.expired : top ? credentialLabel(top.status, lang) : c.missing}
            </span>
          </div>
          {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
          {r.min_count > 1 ? (
            <p className="mt-1 text-xs text-muted-foreground">{c.counter(docs.length, r.min_count)}</p>
          ) : null}
        </div>
        <Button
          size="sm"
          variant={docs.length === 0 ? "default" : "outline"}
          className="shrink-0"
          onClick={onUpload}
        >
          <Upload className="size-4" />
          {docs.length === 0 ? c.upload : docs.length < r.min_count ? c.addMore : c.replace}
        </Button>
      </div>

      {docs.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
          {docs.map((d) => (
            <li
              key={d.id}
              id={`${anchorPrefix}-${d.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.file_name ?? d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.uploadedOn(formatDate(d.created_at, lang))}
                  {d.expiry_date ? ` · ${c.expiry}: ${formatDate(d.expiry_date, lang)}` : ""}
                  {d.issuer ? ` · ${d.issuer}` : ""}
                </p>
                {d.review_note ? <p className="mt-1 text-xs text-destructive">{d.review_note}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                {isExpired(d.expiry_date) ? (
                  <Badge variant="destructive">{v.expired}</Badge>
                ) : isExpiringSoon(d.expiry_date) ? (
                  <Badge variant="outline">{v.expiringSoon}</Badge>
                ) : null}
                <Badge variant={d.status === "approved" ? "default" : "secondary"}>
                  {credentialLabel(d.status, lang)}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => onView(d.file_path)}>
                  <FileText className="size-4" /> {c.view}
                </Button>
                <Button size="icon" variant="ghost" aria-label={c.delete} onClick={() => onDelete(d)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
