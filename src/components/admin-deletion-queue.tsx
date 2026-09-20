import { useState } from "react";
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
    empty: "لا توجد طلبات حذف حساب.",
    reason: "السبب",
    noReason: "بدون سبب",
    note: "ملاحظة الإدارة (اختيارية)",
    start: "بدء المعالجة",
    complete: "تمت المعالجة",
    reject: "رفض",
    updated: "تم تحديث حالة الطلب",
    failed: "تعذّر تحديث الطلب",
    statuses: {
      pending: "قيد الانتظار",
      processing: "قيد المعالجة",
      completed: "تمت المعالجة",
      rejected: "مرفوض",
      cancelled: "ملغى",
    } as Record<string, string>,
    hint: "الحذف الفعلي يتم عبر إجراء تشغيلي موثوق خارج هذه الشاشة؛ هنا تُسجَّل حالة الطلب فقط.",
  },
  en: {
    empty: "No account deletion requests.",
    reason: "Reason",
    noReason: "No reason given",
    note: "Admin note (optional)",
    start: "Start processing",
    complete: "Mark processed",
    reject: "Reject",
    updated: "Request updated",
    failed: "Couldn't update the request",
    statuses: {
      pending: "Pending",
      processing: "Processing",
      completed: "Processed",
      rejected: "Rejected",
      cancelled: "Cancelled",
    } as Record<string, string>,
    hint: "Actual deletion is carried out through a trusted operational process outside this screen; here you only record the request state.",
  },
} as const;

export function AdminDeletionQueue() {
  const { lang } = useLang();
  const c = TXT[lang];
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-deletion-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_account_deletion_requests");
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async (v: { id: string; status: "processing" | "completed" | "rejected" }) => {
      const note = notes[v.id]?.trim();
      const { error } = await supabase.rpc("admin_update_account_deletion", {
        _request_id: v.id,
        _status: v.status,
        ...(note ? { _note: note } : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.updated);
      void qc.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <b className="break-all text-sm">{r.email_snapshot}</b>
            <Badge variant={r.status === "pending" ? "destructive" : "secondary"}>
              {c.statuses[r.status] ?? r.status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(r.requested_at, lang)}
          </p>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">{c.reason}: </span>
            {r.reason || c.noReason}
          </p>
          <Textarea
            className="mt-3"
            rows={2}
            maxLength={1000}
            placeholder={c.note}
            value={notes[r.id] ?? ""}
            onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                disabled={update.isPending}
                onClick={() => update.mutate({ id: r.id, status: "processing" })}
              >
                {update.isPending && <Loader2 className="size-4 animate-spin" />}
                {c.start}
              </Button>
            )}
            {r.status === "processing" && (
              <Button
                size="sm"
                disabled={update.isPending}
                onClick={() => update.mutate({ id: r.id, status: "completed" })}
              >
                {update.isPending && <Loader2 className="size-4 animate-spin" />}
                {c.complete}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={update.isPending}
              onClick={() => update.mutate({ id: r.id, status: "rejected" })}
            >
              {c.reject}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
