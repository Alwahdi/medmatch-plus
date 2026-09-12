import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { credentialLabel, formatDate, countryLabel } from "@/lib/format";
import { useLang } from "@/lib/i18n";

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

const TXT = {
  ar: {
    loading: "جارٍ التحميل...",
    adminOnlyTitle: "هذه الصفحة للإدارة فقط",
    adminOnlyText: "حسابك لا يملك صلاحية مراجعة الوثائق واعتماد المنشآت.",
    backToDashboard: "العودة إلى لوحتك",
    title: "لوحة الإدارة",
    reviewDocs: "مراجعة الوثائق",
    expires: (d: string) => `ينتهي ${d}`,
    approve: "توثيق",
    reject: "رفض",
    noDocs: "لا وثائق للمراجعة.",
    facilities: "المنشآت",
    unverify: "إلغاء التوثيق",
    verify: "توثيق المنشأة",
    docUpdated: "تم تحديث حالة الوثيقة",
    updateFailed: "تعذّر التحديث",
    facilityUpdated: "تم تحديث حالة المنشأة",
  },
  en: {
    loading: "Loading...",
    adminOnlyTitle: "This page is for admins only",
    adminOnlyText: "Your account doesn't have permission to review documents and verify facilities.",
    backToDashboard: "Back to your dashboard",
    title: "Admin panel",
    reviewDocs: "Document review",
    expires: (d: string) => `Expires ${d}`,
    approve: "Verify",
    reject: "Reject",
    noDocs: "No documents to review.",
    facilities: "Facilities",
    unverify: "Remove verification",
    verify: "Verify facility",
    docUpdated: "Document status updated",
    updateFailed: "Failed to update",
    facilityUpdated: "Facility status updated",
  },
} as const;

function AdminPage() {
  const { lang } = useLang();
  const c = TXT[lang];
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
      toast.success(c.docUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-creds"] });
    },
    onError: () => toast.error(c.updateFailed),
  });

  const verifyFacility = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("facilities").update({ is_verified: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.facilityUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-facilities"] });
    },
    onError: () => toast.error(c.updateFailed),
  });

  if (rolesLoading) return <p className="p-10 text-center text-muted-foreground">{c.loading}</p>;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">{c.adminOnlyTitle}</h1>
        <p className="mt-2 text-muted-foreground">{c.adminOnlyText}</p>
        <Link to="/dashboard" className="mt-6 inline-block text-primary underline underline-offset-4">
          {c.backToDashboard}
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>

      <h2 className="mt-8 text-lg font-bold">{c.reviewDocs}</h2>
      <ul className="mt-4 space-y-3">
        {creds?.length ? (
          creds.map((cr) => (
            <li key={cr.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium">{cr.title}</p>
                <p className="text-xs text-muted-foreground">
                  {cr.doc_type}
                  {cr.issuer ? ` · ${cr.issuer}` : ""}
                  {cr.expiry_date ? ` · ${c.expires(formatDate(cr.expiry_date, lang))}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{credentialLabel(cr.status, lang)}</Badge>
                <Button size="sm" onClick={() => review.mutate({ id: cr.id, status: "approved" })}>
                  {c.approve}
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => review.mutate({ id: cr.id, status: "rejected" })}>
                  {c.reject}
                </Button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{c.noDocs}</p>
        )}
      </ul>

      <h2 className="mt-10 text-lg font-bold">{c.facilities}</h2>
      <ul className="mt-4 space-y-3">
        {facilities?.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-medium">{f.name_ar}</p>
              <p className="text-xs text-muted-foreground">{f.city}، {countryLabel(f.country, lang)}</p>
            </div>
            <Button size="sm" variant={f.is_verified ? "outline" : "default"}
              onClick={() => verifyFacility.mutate({ id: f.id, value: !f.is_verified })}>
              {f.is_verified ? c.unverify : c.verify}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
