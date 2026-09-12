import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { CREDENTIAL_LABELS, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | SyndeoCare" },
      { name: "description", content: "مراجعة وثائق التراخيص واعتماد المنشآت الصحية." },
      { property: "og:title", content: "لوحة الإدارة | SyndeoCare" },
      { property: "og:description", content: "مراجعة التوثيق واعتماد المنشآت." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useSession();
  const { data: roles, isLoading: rolesLoading } = useRoles(user);
  const queryClient = useQueryClient();
  const isAdmin = roles?.includes("admin");

  const { data: creds } = useQuery({
    queryKey: ["admin-creds"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: facilities } = useQuery({
    queryKey: ["admin-facilities"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("facilities")
        .select("id,name_ar,country,city,is_verified")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("credentials").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الوثيقة");
      queryClient.invalidateQueries({ queryKey: ["admin-creds"] });
    },
    onError: () => toast.error("تعذّر التحديث"),
  });

  const verifyFacility = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("facilities").update({ is_verified: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة المنشأة");
      queryClient.invalidateQueries({ queryKey: ["admin-facilities"] });
    },
    onError: () => toast.error("تعذّر التحديث"),
  });

  if (rolesLoading) return <p className="p-10 text-center text-muted-foreground">جارٍ التحميل...</p>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">هذه الصفحة للإدارة فقط</h1>
        <p className="mt-2 text-muted-foreground">
          حسابك لا يملك صلاحية مراجعة الوثائق واعتماد المنشآت.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block text-primary underline underline-offset-4">
          العودة إلى لوحتك
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">لوحة الإدارة</h1>

      <h2 className="mt-8 text-lg font-bold">مراجعة الوثائق</h2>
      <ul className="mt-4 space-y-3">
        {creds?.length ? (
          creds.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  {c.doc_type}
                  {c.issuer ? ` · ${c.issuer}` : ""}
                  {c.expiry_date ? ` · ينتهي ${formatDate(c.expiry_date)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{CREDENTIAL_LABELS[c.status]}</Badge>
                <Button size="sm" onClick={() => review.mutate({ id: c.id, status: "approved" })}>
                  توثيق
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => review.mutate({ id: c.id, status: "rejected" })}>
                  رفض
                </Button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">لا وثائق للمراجعة.</p>
        )}
      </ul>

      <h2 className="mt-10 text-lg font-bold">المنشآت</h2>
      <ul className="mt-4 space-y-3">
        {facilities?.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-medium">{f.name_ar}</p>
              <p className="text-xs text-muted-foreground">{f.city}، {f.country}</p>
            </div>
            <Button size="sm" variant={f.is_verified ? "outline" : "default"}
              onClick={() => verifyFacility.mutate({ id: f.id, value: !f.is_verified })}>
              {f.is_verified ? "إلغاء التوثيق" : "توثيق المنشأة"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
