import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  FileText,
  Inbox,
  Loader2,
  Search,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { credentialLabel, formatDate, formatDateTime, countryLabel } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة | SyndeoCare" },
      { name: "description", content: "مراجعة وثائق التراخيص واعتماد المنشآت الصحية وإدارة رسائل التواصل." },
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
    sub: "مراجعة التوثيق، اعتماد المنشآت، ومتابعة رسائل التواصل.",
    tabDocs: "الوثائق",
    tabFacilities: "المنشآت",
    tabPros: "الكوادر",
    tabInbox: "رسائل التواصل",
    statPending: "وثائق بانتظار المراجعة",
    statFacilities: "منشآت غير موثّقة",
    statPros: "كوادر موثّقة",
    statInbox: "رسائل جديدة",
    pendingOnly: "قيد المراجعة فقط",
    all: "الكل",
    expires: (d: string) => `ينتهي ${d}`,
    approve: "اعتماد",
    reject: "رفض",
    view: "عرض الملف",
    noFile: "لا يوجد ملف مرفق",
    noDocs: "لا وثائق للمراجعة.",
    noteLabel: "سبب الرفض (يظهر لصاحب الوثيقة)",
    notePlaceholder: "مثال: صورة الترخيص غير واضحة، أعد رفعها بجودة أعلى.",
    unverify: "إلغاء التوثيق",
    verify: "توثيق",
    search: "بحث بالاسم...",
    docUpdated: "تم تحديث حالة الوثيقة",
    updateFailed: "تعذّر التحديث",
    facilityUpdated: "تم تحديث حالة المنشأة",
    proUpdated: "تم تحديث حالة الكادر",
    autoVerify: "يتم توثيق الكادر تلقائياً عند اعتماد ترخيصه.",
    noPros: "لا توجد ملفات كوادر.",
    noMsgs: "لا توجد رسائل.",
    handled: "تمت المعالجة",
    markHandled: "وضع كمعالجة",
    reopen: "إعادة فتح",
    msgUpdated: "تم تحديث حالة الرسالة",
    experience: (n: number) => `${n} سنة خبرة`,
    fileFailed: "تعذّر فتح الملف",
    rating: (a: number, n: number) => `${a} (${n} تقييم)`,
  },
  en: {
    loading: "Loading...",
    adminOnlyTitle: "This page is for admins only",
    adminOnlyText: "Your account doesn't have permission to review documents and verify facilities.",
    backToDashboard: "Back to your dashboard",
    title: "Admin panel",
    sub: "Review credentials, verify facilities, and follow up on contact messages.",
    tabDocs: "Documents",
    tabFacilities: "Facilities",
    tabPros: "Professionals",
    tabInbox: "Contact inbox",
    statPending: "Documents awaiting review",
    statFacilities: "Unverified facilities",
    statPros: "Verified professionals",
    statInbox: "New messages",
    pendingOnly: "Pending only",
    all: "All",
    expires: (d: string) => `Expires ${d}`,
    approve: "Approve",
    reject: "Reject",
    view: "View file",
    noFile: "No file attached",
    noDocs: "No documents to review.",
    noteLabel: "Rejection reason (shown to the owner)",
    notePlaceholder: "e.g. The license photo is unclear, please upload a higher quality scan.",
    unverify: "Remove verification",
    verify: "Verify",
    search: "Search by name...",
    docUpdated: "Document status updated",
    updateFailed: "Failed to update",
    facilityUpdated: "Facility status updated",
    proUpdated: "Professional status updated",
    autoVerify: "Professionals are verified automatically once their license is approved.",
    noPros: "No professional profiles.",
    noMsgs: "No messages.",
    handled: "Handled",
    markHandled: "Mark as handled",
    reopen: "Reopen",
    msgUpdated: "Message status updated",
    experience: (n: number) => `${n} yrs experience`,
    fileFailed: "Could not open the file",
    rating: (a: number, n: number) => `${a} (${n} reviews)`,
  },
} as const;

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof FileText }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-4 text-primary" /> {label}
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function AdminPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const { data: roles, isLoading: rolesLoading } = useRoles(user);
  const queryClient = useQueryClient();
  const isAdmin = roles?.includes("admin");

  const [pendingOnly, setPendingOnly] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [facQuery, setFacQuery] = useState("");
  const [proQuery, setProQuery] = useState("");

  const { data: creds, isLoading: credsLoading } = useQuery({
    queryKey: ["admin-creds"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: facilities } = useQuery({
    queryKey: ["admin-facilities"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("id,name_ar,country,city,is_verified,rating_avg,rating_count,facility_type")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pros } = useQuery({
    queryKey: ["admin-pros"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("healthcare_professionals")
        .select("id,user_id,full_name,headline,years_experience,country,city,is_verified,rating_avg,rating_count")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: inbox } = useQuery({
    queryKey: ["admin-inbox"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: "approved" | "rejected";
      reviewNote?: string;
    }) => {
      const { error } = await supabase
        .from("credentials")
        .update({ status, review_note: reviewNote ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.docUpdated);
      setRejectId(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-creds"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pros"] });
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

  const verifyPro = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("healthcare_professionals").update({ is_verified: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.proUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-pros"] });
    },
    onError: () => toast.error(c.updateFailed),
  });

  const handleMsg = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ is_handled: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.msgUpdated);
      queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    },
    onError: () => toast.error(c.updateFailed),
  });

  async function openFile(path: string | null) {
    if (!path) {
      toast.error(c.noFile);
      return;
    }
    const { data, error } = await supabase.storage.from("credentials").createSignedUrl(path, 120);
    if (error || !data) {
      toast.error(c.fileFailed);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

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

  const pendingDocs = (creds ?? []).filter((d) => d.status === "pending");
  const shownDocs = pendingOnly ? pendingDocs : creds ?? [];
  const shownFacilities = (facilities ?? []).filter((f) =>
    facQuery.trim() ? f.name_ar.includes(facQuery.trim()) : true,
  );
  const shownPros = (pros ?? []).filter((p) => (proQuery.trim() ? p.full_name.includes(proQuery.trim()) : true));
  const newMsgs = (inbox ?? []).filter((m) => !m.is_handled);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={c.statPending} value={pendingDocs.length} icon={FileText} />
        <StatCard label={c.statFacilities} value={(facilities ?? []).filter((f) => !f.is_verified).length} icon={Building2} />
        <StatCard label={c.statPros} value={(pros ?? []).filter((p) => p.is_verified).length} icon={Stethoscope} />
        <StatCard label={c.statInbox} value={newMsgs.length} icon={Inbox} />
      </div>

      <Tabs defaultValue="docs" className="mt-8">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="docs">
            {c.tabDocs}
            {pendingDocs.length > 0 && (
              <Badge variant="destructive" className="ms-2">
                {pendingDocs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="facilities">{c.tabFacilities}</TabsTrigger>
          <TabsTrigger value="pros">{c.tabPros}</TabsTrigger>
          <TabsTrigger value="inbox">
            {c.tabInbox}
            {newMsgs.length > 0 && (
              <Badge variant="destructive" className="ms-2">
                {newMsgs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={pendingOnly ? "default" : "outline"} onClick={() => setPendingOnly(true)}>
              {c.pendingOnly}
            </Button>
            <Button size="sm" variant={pendingOnly ? "outline" : "default"} onClick={() => setPendingOnly(false)}>
              {c.all}
            </Button>
            <span className="text-xs text-muted-foreground">{c.autoVerify}</span>
          </div>

          {credsLoading ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {c.loading}
            </p>
          ) : shownDocs.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {c.noDocs}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {shownDocs.map((cr) => (
                <li key={cr.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{cr.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {credentialLabel(cr.doc_type, lang)}
                        {cr.issuer ? ` · ${cr.issuer}` : ""}
                        {cr.expiry_date ? ` · ${c.expires(formatDate(cr.expiry_date, lang))}` : ""}
                        {` · ${formatDate(cr.created_at, lang)}`}
                      </p>
                      {cr.review_note && (
                        <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">{cr.review_note}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          cr.status === "approved" ? "default" : cr.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {credentialLabel(cr.status, lang)}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => openFile(cr.file_path)}>
                        <FileText className="size-4" /> {c.view}
                      </Button>
                      <Button
                        size="sm"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: cr.id, status: "approved" })}
                      >
                        <CheckCircle2 className="size-4" /> {c.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejectId(rejectId === cr.id ? null : cr.id);
                          setNote(cr.review_note ?? "");
                        }}
                      >
                        <XCircle className="size-4" /> {c.reject}
                      </Button>
                    </div>
                  </div>

                  {rejectId === cr.id && (
                    <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
                      <label className="text-xs font-medium" htmlFor={`note-${cr.id}`}>
                        {c.noteLabel}
                      </label>
                      <Textarea
                        id={`note-${cr.id}`}
                        rows={2}
                        className="mt-2 bg-background"
                        value={note}
                        placeholder={c.notePlaceholder}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="mt-2"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: cr.id, status: "rejected", reviewNote: note.trim() })}
                      >
                        {c.reject}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="facilities" className="mt-6">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              className="ps-9"
              value={facQuery}
              onChange={(e) => setFacQuery(e.target.value)}
              placeholder={c.search}
            />
          </div>
          <ul className="mt-4 space-y-3">
            {shownFacilities.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div>
                  <p className="flex items-center gap-2 font-bold">
                    {f.name_ar}
                    {f.is_verified && <ShieldCheck className="size-4 text-accent" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {f.city}، {countryLabel(f.country, lang)}
                    {f.rating_count > 0 ? ` · ${c.rating(Number(f.rating_avg), f.rating_count)}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={f.is_verified ? "outline" : "default"}
                  onClick={() => verifyFacility.mutate({ id: f.id, value: !f.is_verified })}
                >
                  {f.is_verified ? c.unverify : c.verify}
                </Button>
              </li>
            ))}
          </ul>
        </TabsContent>

        <TabsContent value="pros" className="mt-6">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
            <Input
              className="ps-9"
              value={proQuery}
              onChange={(e) => setProQuery(e.target.value)}
              placeholder={c.search}
            />
          </div>
          {shownPros.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {c.noPros}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {shownPros.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div>
                    <p className="flex items-center gap-2 font-bold">
                      {p.full_name}
                      {p.is_verified && <ShieldCheck className="size-4 text-accent" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.headline ? `${p.headline} · ` : ""}
                      {c.experience(p.years_experience)}
                      {p.city ? ` · ${p.city}` : ""}
                      {p.rating_count > 0 ? ` · ${c.rating(Number(p.rating_avg), p.rating_count)}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={p.is_verified ? "outline" : "default"}
                    onClick={() => verifyPro.mutate({ id: p.id, value: !p.is_verified })}
                  >
                    {p.is_verified ? c.unverify : c.verify}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="inbox" className="mt-6">
          {(inbox ?? []).length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              {c.noMsgs}
            </p>
          ) : (
            <ul className="space-y-3">
              {(inbox ?? []).map((m) => (
                <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">
                        {m.subject || m.name}
                        {m.is_handled && (
                          <Badge variant="secondary" className="ms-2">
                            {c.handled}
                          </Badge>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {m.name} · {m.email} · {formatDateTime(m.created_at, lang)}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${m.email}`}>{m.email}</a>
                      </Button>
                      <Button
                        size="sm"
                        variant={m.is_handled ? "outline" : "default"}
                        onClick={() => handleMsg.mutate({ id: m.id, value: !m.is_handled })}
                      >
                        {m.is_handled ? c.reopen : c.markHandled}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
