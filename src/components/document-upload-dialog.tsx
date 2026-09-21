import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { reqName, reqNote, type DocRequirement } from "@/lib/document-requirements";
import { useLang } from "@/lib/i18n";
import { ACCEPT, prepareUpload } from "@/lib/storage";
import { friendlyError, userError } from "@/lib/user-errors";

const TXT = {
  ar: {
    title: (n: string) => `رفع: ${n}`,
    desc: "أرفق الملف واملأ البيانات المطلوبة، ثم يراجعه فريقنا.",
    pick: "اختر ملفاً أو اسحبه إلى هنا",
    pickHint: "PDF أو صورة، حتى ١٠ ميجابايت",
    choose: "اختيار ملف",
    remove: "إزالة الملف",
    issuer: "الجهة المُصدِرة",
    issueDate: "تاريخ الإصدار",
    expiry: "تاريخ الانتهاء",
    counter: (a: number, b: number) => `رفعت ${a} من ${b} ملفات مطلوبة لهذه الوثيقة`,
    fileReq: "اختر ملف الوثيقة أولاً",
    issuerReq: "أدخل الجهة المُصدِرة",
    issueReq: "أدخل تاريخ الإصدار",
    expiryReq: "أدخل تاريخ الانتهاء",
    expiryPast: "تاريخ الانتهاء يجب أن يكون في المستقبل",
    upload: "رفع الوثيقة",
    uploading: "جارٍ الرفع...",
    cancel: "إلغاء",
    done: "تم رفع الوثيقة، وستبقى «قيد المراجعة» حتى ينتهي فريقنا من مراجعتها",
    failed: "تعذّر رفع الوثيقة",
  },
  en: {
    title: (n: string) => `Upload: ${n}`,
    desc: "Attach the file and fill in the required details, then our team reviews it.",
    pick: "Choose a file or drop it here",
    pickHint: "PDF or image, up to 10 MB",
    choose: "Choose file",
    remove: "Remove file",
    issuer: "Issuing authority",
    issueDate: "Issue date",
    expiry: "Expiry date",
    counter: (a: number, b: number) => `${a} of ${b} required files uploaded for this document`,
    fileReq: "Choose the document file first",
    issuerReq: "Enter the issuing authority",
    issueReq: "Enter the issue date",
    expiryReq: "Enter the expiry date",
    expiryPast: "Expiry date must be in the future",
    upload: "Upload document",
    uploading: "Uploading...",
    cancel: "Cancel",
    done: "Document uploaded — it stays “Under review” until our team completes the review",
    failed: "Failed to upload the document",
  },
} as const;

type Props = {
  requirement: DocRequirement | null;
  /** user id for professionals, facility id for facilities */
  ownerId: string | undefined;
  uploadedCount: number;
  onOpenChange: (open: boolean) => void;
};

/** نافذة رفع وثيقة واحدة: النوع محدّد سلفاً والحقول تُبنى من إعدادات الإدارة. */
export function DocumentUploadDialog({ requirement, ownerId, uploadedCount, onOpenChange }: Props) {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiry, setExpiry] = useState("");
  const [dragging, setDragging] = useState(false);

  const open = !!requirement;
  const isFacility = requirement?.target === "facility";

  useEffect(() => {
    if (open) {
      setFile(null);
      setIssuer("");
      setIssueDate("");
      setExpiry("");
      setDragging(false);
    }
  }, [open, requirement?.id]);

  const save = useMutation({
    mutationFn: async () => {
      const r = requirement!;
      if (!file) userError(c.fileReq);
      if (r.requires_issuer && !issuer.trim()) userError(c.issuerReq);
      if (r.requires_issue_date && !issueDate) userError(c.issueReq);
      if (r.requires_expiry && !expiry) userError(c.expiryReq);
      if (expiry && expiry < new Date().toISOString().slice(0, 10)) userError(c.expiryPast);

      const ready = await prepareUpload(file, "document", lang).catch((e: Error) => userError(e.message));
      const ext = ready.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const bucket = isFacility ? "facility-docs" : "credentials";
      const filePath = `${ownerId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, ready, { contentType: ready.type || "application/octet-stream" });
      if (upErr) throw upErr;

      const common = {
        doc_type: r.code,
        title: r.name_ar,
        file_name: file.name.slice(0, 200),
        issuer: issuer.trim() || null,
        issue_date: issueDate || null,
        expiry_date: expiry || null,
        file_path: filePath,
      };
      const { error } = isFacility
        ? await supabase.from("facility_documents").insert({ ...common, facility_id: ownerId! })
        : await supabase.from("credentials").insert({ ...common, user_id: ownerId! });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.done);
      void queryClient.invalidateQueries({ queryKey: [isFacility ? "facility-docs" : "my-creds"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  if (!requirement) return null;
  const note = reqNote(requirement, lang);

  return (
    <Dialog open={open} onOpenChange={(o) => !save.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{c.title(reqName(requirement, lang))}</DialogTitle>
          <DialogDescription>{c.desc}</DialogDescription>
        </DialogHeader>

        {note ? (
          <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">{note}</p>
        ) : null}
        {requirement.min_count > 1 ? (
          <p className="text-xs text-muted-foreground">{c.counter(uploadedCount, requirement.min_count)}</p>
        ) : null}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
          className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-surface"
          }`}
        >
          <input
            ref={inputRef}
            id="doc-file"
            type="file"
            accept={ACCEPT.document}
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-between gap-3 text-start">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={c.remove}
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <>
              <FileUp className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-2 text-sm">{c.pick}</p>
              <p className="text-xs text-muted-foreground">{c.pickHint}</p>
              <Button type="button" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
                {c.choose}
              </Button>
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {requirement.requires_issuer ? (
            <div className="sm:col-span-2">
              <Label htmlFor="doc-issuer">
                {c.issuer} <span className="text-destructive">*</span>
              </Label>
              <Input id="doc-issuer" maxLength={120} value={issuer} onChange={(e) => setIssuer(e.target.value)} />
            </div>
          ) : null}
          {requirement.requires_issue_date ? (
            <div>
              <Label htmlFor="doc-issued">
                {c.issueDate} <span className="text-destructive">*</span>
              </Label>
              <Input id="doc-issued" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
          ) : null}
          {requirement.requires_expiry ? (
            <div>
              <Label htmlFor="doc-expiry">
                {c.expiry} <span className="text-destructive">*</span>
              </Label>
              <Input id="doc-expiry" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            {c.cancel}
          </Button>
          <Button onClick={() => save.mutate()} loading={save.isPending}>
            <Upload className="size-4" /> {save.isPending ? c.uploading : c.upload}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
