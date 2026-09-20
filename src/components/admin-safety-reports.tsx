import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/error-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { friendlyError } from "@/lib/user-errors";

const TXT = {
  ar: {
    empty: "لا توجد بلاغات سلامة.",
    hint: "البلاغ لا يُنفّذ أي إجراء تلقائي على الحساب أو الإعلان؛ القرار يدوي بعد المراجعة.",
    details: "تفاصيل المُبلِّغ",
    noDetails: "بدون تفاصيل",
    note: "ملاحظة الإدارة (اختيارية)",
    review: "بدء المراجعة",
    resolve: "معالجة",
    dismiss: "رفض البلاغ",
    open: "فتح العنصر",
    updated: "تم تحديث البلاغ",
    failed: "تعذّر تحديث البلاغ",
    targets: { job: "وظيفة", shift: "مناوبة", conversation: "محادثة", message: "رسالة" } as Record<string, string>,
    statuses: { open: "جديد", reviewing: "قيد المراجعة", resolved: "معالج", dismissed: "مرفوض" } as Record<string, string>,
    cats: {
      misleading: "معلومات مضللة",
      fraud_or_fee: "احتيال أو رسوم",
      harassment: "تحرّش أو إساءة",
      privacy: "انتهاك خصوصية",
      unsafe_content: "محتوى غير آمن",
      other: "سبب آخر",
    } as Record<string, string>,
  },
  en: {
    empty: "No safety reports.",
    hint: "A report triggers no automatic action on an account or listing; every decision is manual after review.",
    details: "Reporter details",
    noDetails: "No details given",
    note: "Admin note (optional)",
    review: "Start review",
    resolve: "Resolve",
    dismiss: "Dismiss",
    open: "Open target",
    updated: "Report updated",
    failed: "Couldn't update the report",
    targets: { job: "Job", shift: "Shift", conversation: "Conversation", message: "Message" } as Record<string, string>,
    statuses: { open: "New", reviewing: "Reviewing", resolved: "Resolved", dismissed: "Dismissed" } as Record<string, string>,
    cats: {
      misleading: "Misleading information",
      fraud_or_fee: "Fraud or fees",
      harassment: "Harassment or abuse",
      privacy: "Privacy violation",
      unsafe_content: "Unsafe content",
      other: "Something else",
    } as Record<string, string>,
  },
} as const;

export function AdminSafetyReports() {
  const { lang } = useLang();
  const c = TXT[lang];
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-safety-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_safety_reports");
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; status: "reviewing" | "resolved" | "dismissed" }) => {
      const note = notes[v.id]?.trim();
      const { error } = await supabase.rpc("admin_update_safety_report", {
        _id: v.id,
        _status: v.status,
        ...(note ? { _note: note } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.updated);
      void qc.invalidateQueries({ queryKey: ["admin-safety-reports"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  if (isLoading) return <ListSkeleton rows={3} />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!data?.length)
    return (
      <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {c.empty}
      </p>
    );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{c.hint}</p>
      {data.map((r) => (
        <div key={r.id} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{c.targets[r.target_type] ?? r.target_type}</Badge>
            <b className="min-w-0 break-words text-sm">{c.cats[r.category] ?? r.category}</b>
            <Badge
              className="ms-auto"
              variant={r.status === "open" ? "destructive" : r.status === "reviewing" ? "secondary" : "outline"}
            >
              {c.statuses[r.status] ?? r.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(r.created_at, lang)}
            {r.target_label ? ` · ${r.target_label}` : ""}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">{c.details}: </span>
            {r.details || c.noDetails}
          </p>

          {r.target_type === "job" && (
            <Link
              to="/jobs/$jobId"
              params={{ jobId: r.target_id }}
              className="mt-2 inline-block text-sm text-primary underline underline-offset-4"
            >
              {c.open}
            </Link>
          )}
          {r.target_type === "shift" && (
            <Link
              to="/shifts/$shiftId"
              params={{ shiftId: r.target_id }}
              className="mt-2 inline-block text-sm text-primary underline underline-offset-4"
            >
              {c.open}
            </Link>
          )}

          {(r.status === "open" || r.status === "reviewing") && (
            <>
              <Textarea aria-label={c.note}
                className="mt-3"
                rows={2}
                maxLength={1000}
                placeholder={c.note}
                value={notes[r.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: r.id, status: "reviewing" })}
                  >
                    {update.isPending && <Loader2 className="size-4 animate-spin" />}
                    {c.review}
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: r.id, status: "resolved" })}
                >
                  {update.isPending && <Loader2 className="size-4 animate-spin" />}
                  {c.resolve}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={update.isPending}
                  onClick={() => update.mutate({ id: r.id, status: "dismissed" })}
                >
                  {c.dismiss}
                </Button>
              </div>
            </>
          )}
          {r.admin_note && (
            <p className="mt-2 text-xs text-muted-foreground">{r.admin_note}</p>
          )}
        </div>
      ))}
    </div>
  );
}
