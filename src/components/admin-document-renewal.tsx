import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";

export function AdminDocumentRenewal() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [days, setDays] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const policy = useQuery({ queryKey: ["admin-document-renewal"], queryFn: async () => {
    const { data, error } = await supabase.from("document_renewal_policy").select("renewal_days").single();
    if (error) throw error;
    return data.renewal_days;
  } });
  const requests = useQuery({ queryKey: ["admin-document-upload-requests"], queryFn: async () => {
    const { data, error } = await supabase.from("document_upload_requests").select("id,user_id,target,doc_type,reason,created_at,status").eq("status", "pending").order("created_at");
    if (error) throw error;
    return data;
  } });
  const save = useMutation({ mutationFn: async (value: number) => {
    const { error } = await supabase.rpc("admin_set_document_renewal_days", { _days: value });
    if (error) throw error;
  }, onSuccess: () => { toast.success(lang === "ar" ? "حُفظت نافذة التجديد" : "Renewal window saved"); setDays(""); void qc.invalidateQueries({ queryKey: ["admin-document-renewal"] }); }, onError: (error) => toast.error(friendlyError(error, lang)) });
  const review = useMutation({ mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
    const { error } = await supabase.rpc("admin_review_document_upload_request", { _id: id, _approve: approve, _note: notes[id]?.trim() || undefined });
    if (error) throw error;
  }, onSuccess: () => { toast.success(lang === "ar" ? "حُفظ القرار" : "Decision saved"); void qc.invalidateQueries({ queryKey: ["admin-document-upload-requests"] }); }, onError: (error) => toast.error(friendlyError(error, lang)) });
  return <section className="space-y-5 rounded-lg border border-border bg-card p-4 sm:p-6">
    <div><h2 className="text-lg font-bold">{lang === "ar" ? "التجديد واستبدال الوثائق" : "Document renewals & replacements"}</h2><p className="text-sm text-muted-foreground">{lang === "ar" ? "تُفتح نافذة التجديد قبل تاريخ الانتهاء بالمدة المحددة. الوثائق دون تاريخ انتهاء تتطلب موافقة." : "Renewal opens this many days before expiry. Documents without expiry require approval."}</p></div>
    {policy.isError ? <Button variant="outline" onClick={() => void policy.refetch()}>{lang === "ar" ? "إعادة المحاولة" : "Retry"}</Button> : <div className="flex flex-wrap items-end gap-3"><div className="space-y-2"><Label htmlFor="renewal-days">{lang === "ar" ? "الأيام قبل الانتهاء (0–365)" : "Days before expiry (0–365)"}</Label><Input id="renewal-days" type="number" min={0} max={365} value={days} onChange={(e) => setDays(e.target.value)} placeholder={policy.data === undefined ? "…" : String(policy.data)} className="w-48" /></div><Button disabled={save.isPending || !/^(0|[1-9]\d*)$/.test(days) || Number(days) > 365} onClick={() => save.mutate(Number(days))}>{lang === "ar" ? "حفظ" : "Save"}</Button></div>}
    <h3 className="font-bold">{lang === "ar" ? `طلبات الاستبدال (${requests.data?.length ?? 0})` : `Replacement requests (${requests.data?.length ?? 0})`}</h3>
    {requests.isPending ? <p>{lang === "ar" ? "جارٍ التحميل…" : "Loading…"}</p> : requests.isError ? <Button variant="outline" onClick={() => void requests.refetch()}>{lang === "ar" ? "إعادة المحاولة" : "Retry"}</Button> : !requests.data?.length ? <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا توجد طلبات معلقة." : "No pending requests."}</p> : requests.data.map((r) => <div key={r.id} className="space-y-3 rounded-lg border p-4"><p className="font-bold">{r.doc_type} · {r.target === "facility" ? (lang === "ar" ? "منشأة" : "Facility") : (lang === "ar" ? "مختص" : "Professional")}</p><p className="break-all text-xs text-muted-foreground">{r.user_id} · {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar-YE" : "en-US")}</p><p className="whitespace-pre-wrap text-sm">{r.reason}</p><Label htmlFor={`renewal-note-${r.id}`}>{lang === "ar" ? "ملاحظة القرار" : "Decision note"}</Label><Textarea id={`renewal-note-${r.id}`} maxLength={500} value={notes[r.id] ?? ""} onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))} /><div className="flex gap-2"><Button disabled={review.isPending} onClick={() => review.mutate({ id: r.id, approve: true })}>{lang === "ar" ? "السماح برفع البديل" : "Allow replacement"}</Button><Button variant="outline" disabled={review.isPending || !(notes[r.id] ?? "").trim()} onClick={() => review.mutate({ id: r.id, approve: false })}>{lang === "ar" ? "رفض مع توضيح" : "Decline with reason"}</Button></div></div>)}
  </section>;
}