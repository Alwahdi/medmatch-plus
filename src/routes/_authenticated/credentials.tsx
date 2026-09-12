import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FileCheck2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { CREDENTIAL_LABELS, DOC_TYPES, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/credentials")({
  head: () => ({
    meta: [
      { title: "ملف الاعتماد والتراخيص | SyndeoCare" },
      { name: "description", content: "ارفع ترخيص المزاولة والشهادات ليتم توثيقها قبل التقديم." },
      { property: "og:title", content: "ملف الاعتماد | SyndeoCare" },
      { property: "og:description", content: "توثيق التراخيص والشهادات الطبية." },
    ],
  }),
  component: CredentialsPage,
});

const schema = z.object({
  title: z.string().trim().min(2, "أدخل اسم الوثيقة").max(120),
  doc_type: z.string().min(1, "اختر نوع الوثيقة"),
  issuer: z.string().trim().max(120).optional(),
});

function CredentialsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", doc_type: "", issuer: "", expiry_date: "" });
  const [file, setFile] = useState<File | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["my-creds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      if (file && file.size > 10 * 1024 * 1024) throw new Error("حجم الملف يتجاوز ١٠ ميجابايت");

      let filePath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
        filePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("credentials").upload(filePath, file);
        if (upErr) throw new Error("تعذّر رفع الملف");
      }

      const { error } = await supabase.from("credentials").insert({
        user_id: user!.id,
        title: form.title.trim(),
        doc_type: form.doc_type,
        issuer: form.issuer.trim() || null,
        expiry_date: form.expiry_date || null,
        file_path: filePath,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم رفع الوثيقة، ستتم مراجعتها خلال ٢٤–٤٨ ساعة");
      setForm({ title: "", doc_type: "", issuer: "", expiry_date: "" });
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-creds"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذّر الحفظ"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف الوثيقة");
      queryClient.invalidateQueries({ queryKey: ["my-creds"] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">ملف الاعتماد</h1>
      <p className="mt-2 text-muted-foreground">
        وثائقك تُراجع من فريقنا، والمنشآت ترى حالة التوثيق فقط — لا تُنشر ملفاتك للعامة.
      </p>

      <div className="card-lift mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold">إضافة وثيقة</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>نوع الوثيقة</Label>
            <Select value={form.doc_type} onValueChange={(v) => setForm({ ...form, doc_type: v })}>
              <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="title">اسم الوثيقة</Label>
            <Input id="title" maxLength={120} value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="issuer">الجهة المُصدِرة</Label>
            <Input id="issuer" maxLength={120} placeholder="مثال: الهيئة السعودية للتخصصات الصحية"
              value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="exp">تاريخ الانتهاء</Label>
            <Input id="exp" type="date" value={form.expiry_date}
              onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="file">الملف (PDF أو صورة، حتى ١٠ ميجابايت)</Label>
          <Input id="file" type="file" accept=".pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button onClick={() => add.mutate()} disabled={add.isPending}>
          <Upload className="size-4" /> {add.isPending ? "جارٍ الرفع..." : "رفع الوثيقة"}
        </Button>
      </div>

      <h2 className="mt-10 text-lg font-bold">وثائقي</h2>
      {isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">جارٍ التحميل...</p>
      ) : items?.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <FileCheck2 className="size-5 text-primary" />
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.doc_type}
                    {c.expiry_date ? ` · ينتهي ${formatDate(c.expiry_date)}` : ""}
                  </p>
                  {c.review_note && <p className="mt-1 text-xs text-destructive">{c.review_note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.status === "approved" ? "default" : "secondary"}>
                  {CREDENTIAL_LABELS[c.status]}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">لم ترفع أي وثيقة بعد.</p>
      )}
    </div>
  );
}
