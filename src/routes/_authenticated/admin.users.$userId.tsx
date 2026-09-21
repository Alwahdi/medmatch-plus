import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { credentialLabel, facilityDocTypeLabel, formatDate, formatDateTime } from "@/lib/format";
import { friendlyError } from "@/lib/user-errors";
import { reqName, useAllDocumentRequirements } from "@/lib/document-requirements";

export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  head: () => ({
    meta: [
      { title: "ملف المستخدم — لوحة الإدارة | SyndeoCare" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUserPage,
});

type Doc = {
  id: string;
  doc_type: string;
  title: string;
  file_name: string | null;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
};

type Overview = {
  user_id: string;
  profile: { full_name: string; phone: string | null; country: string | null; city: string | null; created_at: string } | null;
  roles: string[];
  professional:
    | {
        id: string;
        full_name: string;
        headline: string | null;
        years_experience: number;
        country: string | null;
        city: string | null;
        bio: string | null;
        license_country: string | null;
        license_number: string | null;
        is_verified: boolean;
        rating_avg: number;
        rating_count: number;
      }
    | null;
  specialty: { name_ar: string; name_en: string } | null;
  facility:
    | {
        id: string;
        name_ar: string;
        name_en: string | null;
        facility_type: string;
        country: string;
        city: string;
        description: string | null;
        website: string | null;
        is_verified: boolean;
        rating_avg: number;
        rating_count: number;
      }
    | null;
  subscription: { plan_code: string; status: string; ends_at: string } | null;
  credentials: Doc[];
  facility_documents: Doc[];
  change_requests: { id: string; field: string; new_value: string; status: string; created_at: string }[];
  change_log: { id: string; field: string; old_value: string | null; new_value: string | null; created_at: string }[];
  reports: { id: string; category: string; status: string; details: string | null; created_at: string }[];
  stats: Record<string, number>;
};

const T = {
  ar: {
    back: "رجوع",
    loading: "جارٍ التحميل…",
    failed: "تعذّر فتح الملف",
    verified: "موثّق",
    notVerified: "غير موثّق",
    joined: (d: string) => `انضم في ${d}`,
    needsAction: "يحتاج إلى إجراء",
    nothingPending: "لا يوجد ما ينتظر إجراءً.",
    pendingDocs: (n: number) => `${n} مستند قيد المراجعة`,
    missingDocs: (n: number) => `${n} مستند مطلوب لم يُرفع`,
    expiredDocs: (n: number) => `${n} مستند منتهي الصلاحية`,
    pendingChanges: (n: number) => `${n} طلب تعديل معلّق`,
    openReports: (n: number) => `${n} بلاغ مفتوح`,
    approveAll: "اعتماد كل المستندات المعلّقة",
    approved: "تم الاعتماد",
    approveFailed: "تعذّر الاعتماد",
    data: "البيانات",
    docs: "المستندات",
    noDocs: "لا مستندات مرفوعة.",
    activity: "سجل النشاط",
    changes: "طلبات التعديل",
    log: "سجل التغييرات",
    reports: "البلاغات",
    none: "لا شيء",
    specialty: "التخصص",
    experience: "سنوات الخبرة",
    location: "الموقع",
    bio: "نبذة",
    license: "الرخصة",
    phone: "الهاتف",
    rating: "التقييم",
    type: "نوع المنشأة",
    website: "الموقع الإلكتروني",
    plan: "الاشتراك",
    roles: "الأدوار",
    issuer: "جهة الإصدار",
    issued: "تاريخ الإصدار",
    expires: "تاريخ الانتهاء",
    approve: "اعتماد",
    reject: "رفض",
    rejectPrompt: "سبب الرفض (يظهر لصاحب المستند):",
    statLabels: {
      applications: "طلبات تقديم",
      hired: "تم قبوله",
      shift_bookings: "حجوزات مناوبات",
      shifts_completed: "مناوبات منجزة",
      hours_worked: "ساعات عمل",
      interviews: "مقابلات",
      jobs_posted: "وظائف منشورة",
      shifts_posted: "مناوبات منشورة",
      reviews_received: "تقييمات مستلمة",
    } as Record<string, string>,
  },
  en: {
    back: "Back",
    loading: "Loading…",
    failed: "Could not open this profile",
    verified: "Verified",
    notVerified: "Not verified",
    joined: (d: string) => `Joined ${d}`,
    needsAction: "Needs action",
    nothingPending: "Nothing is waiting on you.",
    pendingDocs: (n: number) => `${n} documents pending review`,
    missingDocs: (n: number) => `${n} required documents not uploaded`,
    expiredDocs: (n: number) => `${n} expired documents`,
    pendingChanges: (n: number) => `${n} pending change requests`,
    openReports: (n: number) => `${n} open reports`,
    approveAll: "Approve all pending documents",
    approved: "Approved",
    approveFailed: "Could not approve",
    data: "Details",
    docs: "Documents",
    noDocs: "No documents uploaded.",
    activity: "Activity",
    changes: "Change requests",
    log: "Change log",
    reports: "Reports",
    none: "None",
    specialty: "Specialty",
    experience: "Years of experience",
    location: "Location",
    bio: "Bio",
    license: "License",
    phone: "Phone",
    rating: "Rating",
    type: "Facility type",
    website: "Website",
    plan: "Subscription",
    roles: "Roles",
    issuer: "Issuer",
    issued: "Issue date",
    expires: "Expiry date",
    approve: "Approve",
    reject: "Reject",
    rejectPrompt: "Rejection reason (shown to the owner):",
    statLabels: {
      applications: "Applications",
      hired: "Hired",
      shift_bookings: "Shift bookings",
      shifts_completed: "Shifts completed",
      hours_worked: "Hours worked",
      interviews: "Interviews",
      jobs_posted: "Jobs posted",
      shifts_posted: "Shifts posted",
      reviews_received: "Reviews received",
    } as Record<string, string>,
  },
} as const;

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-wrap gap-2 py-1.5 text-sm">
      <span className="min-w-32 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AdminUserPage() {
  const { userId } = Route.useParams();
  const { lang } = useLang();
  const c = T[lang];
  const queryClient = useQueryClient();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin-user-overview", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_user_overview", { _user_id: userId });
      if (error) throw error;
      return data as unknown as Overview;
    },
  });

  const { data: proReq } = useAllDocumentRequirements("professional");
  const { data: facReq } = useAllDocumentRequirements("facility");

  const isFacility = !!data?.facility;
  const docs = (isFacility ? data?.facility_documents : data?.credentials) ?? [];
  const requirements = (isFacility ? facReq : proReq)?.filter((r) => r.is_active && r.is_required) ?? [];
  const docLabel = (t: string) => (isFacility ? facilityDocTypeLabel(t, lang) : credentialLabel(t, lang));

  const today = new Date().toISOString().slice(0, 10);
  const pendingDocs = docs.filter((d) => d.status === "pending");
  const expiredDocs = docs.filter((d) => d.status === "approved" && d.expiry_date && d.expiry_date < today);
  const missing = requirements.filter((r) => !docs.some((d) => d.doc_type === r.code));
  const pendingChanges = (data?.change_requests ?? []).filter((r) => r.status === "pending");
  const openReports = (data?.reports ?? []).filter((r) => r.status !== "resolved" && r.status !== "dismissed");

  const review = useMutation({
    mutationFn: async (v: { id: string; status: "approved" | "rejected"; note?: string | null }) => {
      const fn = isFacility ? "admin_review_facility_document" : "admin_review_credential";
      const { error } = await supabase.rpc(fn, {
        _id: v.id,
        _status: v.status,
        _review_note: v.note ?? null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.approved);
      queryClient.invalidateQueries({ queryKey: ["admin-user-overview", userId] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.approveFailed)),
  });

  const approveAll = useMutation({
    mutationFn: async () => {
      for (const d of pendingDocs) {
        const fn = isFacility ? "admin_review_facility_document" : "admin_review_credential";
        const { error } = await supabase.rpc(fn, { _id: d.id, _status: "approved", _review_note: null } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(c.approved);
      queryClient.invalidateQueries({ queryKey: ["admin-user-overview", userId] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.approveFailed)),
  });

  if (isPending)
    return (
      <div className="container-page py-10">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {c.loading}
        </p>
      </div>
    );

  if (isError || !data)
    return (
      <div className="container-page py-10">
        <p className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {friendlyError(error as Error, lang, c.failed)}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin">
            <ArrowRight className="size-4" /> {c.back}
          </Link>
        </Button>
      </div>
    );

  const name = data.facility?.name_ar ?? data.professional?.full_name ?? data.profile?.full_name ?? "—";
  const verified = data.facility?.is_verified ?? data.professional?.is_verified ?? false;
  const loc = [data.facility?.city ?? data.professional?.city, data.facility?.country ?? data.professional?.country]
    .filter(Boolean)
    .join("، ");

  const actions = [
    pendingDocs.length ? c.pendingDocs(pendingDocs.length) : null,
    missing.length ? c.missingDocs(missing.length) : null,
    expiredDocs.length ? c.expiredDocs(expiredDocs.length) : null,
    pendingChanges.length ? c.pendingChanges(pendingChanges.length) : null,
    openReports.length ? c.openReports(openReports.length) : null,
  ].filter(Boolean) as string[];

  return (
    <div className="container-page space-y-6 py-6">
      <Button asChild variant="ghost" size="sm" className="-ms-2">
        <Link to="/admin">
          <ArrowRight className="size-4 rtl:rotate-180" /> {c.back}
        </Link>
      </Button>

      <header className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">{name}</h1>
          <Badge variant={verified ? "default" : "outline"}>
            {verified ? <ShieldCheck className="size-3.5" /> : null}
            {verified ? c.verified : c.notVerified}
          </Badge>
          {data.roles.map((r) => (
            <Badge key={r} variant="secondary">
              {r}
            </Badge>
          ))}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[loc, data.profile ? c.joined(formatDate(data.profile.created_at, lang)) : null].filter(Boolean).join(" · ")}
        </p>
        {pendingDocs.length > 0 ? (
          <Button className="mt-4" onClick={() => approveAll.mutate()} loading={approveAll.isPending}>
            <CheckCircle2 className="size-4" /> {c.approveAll} ({pendingDocs.length})
          </Button>
        ) : null}
      </header>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4 text-amber-500" /> {c.needsAction}
        </h2>
        {actions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{c.nothingPending}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {actions.map((a) => (
              <li key={a}>• {a}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">{c.data}</h2>
        <div className="mt-2 divide-y divide-border/60">
          <Row label={c.phone} value={data.profile?.phone} />
          <Row label={c.location} value={loc || null} />
          {data.professional ? (
            <>
              <Row
                label={c.specialty}
                value={data.specialty ? (lang === "en" ? data.specialty.name_en : data.specialty.name_ar) : null}
              />
              <Row label={c.experience} value={String(data.professional.years_experience)} />
              <Row label={c.bio} value={data.professional.headline ?? data.professional.bio} />
              <Row
                label={c.license}
                value={[data.professional.license_number, data.professional.license_country].filter(Boolean).join(" · ") || null}
              />
              <Row
                label={c.rating}
                value={data.professional.rating_count ? `${data.professional.rating_avg} (${data.professional.rating_count})` : null}
              />
            </>
          ) : null}
          {data.facility ? (
            <>
              <Row label={c.type} value={data.facility.facility_type} />
              <Row label={c.bio} value={data.facility.description} />
              <Row label={c.website} value={data.facility.website} />
              <Row
                label={c.plan}
                value={
                  data.subscription
                    ? `${data.subscription.plan_code} · ${data.subscription.status} · ${formatDate(data.subscription.ends_at, lang)}`
                    : null
                }
              />
              <Row
                label={c.rating}
                value={data.facility.rating_count ? `${data.facility.rating_avg} (${data.facility.rating_count})` : null}
              />
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">{c.docs}</h2>
        {requirements.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {requirements.map((r) => {
              const has = docs.filter((d) => d.doc_type === r.code);
              const ok = has.some((d) => d.status === "approved");
              const pend = has.some((d) => d.status === "pending");
              return (
                <Badge key={r.id} variant={ok ? "default" : pend ? "secondary" : "outline"}>
                  {reqName(r, lang)}
                </Badge>
              );
            })}
          </div>
        ) : null}
        {docs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{c.noDocs}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {docs.map((d) => (
              <li key={d.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{docLabel(d.doc_type)}</span>
                  <Badge variant={d.status === "approved" ? "default" : d.status === "pending" ? "secondary" : "destructive"}>
                    {credentialLabel(d.status, lang)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{d.file_name ?? d.title}</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  {[
                    d.issuer ? `${c.issuer}: ${d.issuer}` : null,
                    d.issue_date ? `${c.issued}: ${formatDate(d.issue_date, lang)}` : null,
                    d.expiry_date ? `${c.expires}: ${formatDate(d.expiry_date, lang)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {d.status === "pending" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => review.mutate({ id: d.id, status: "approved" })}
                      loading={review.isPending}
                    >
                      <CheckCircle2 className="size-4" /> {c.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const note = window.prompt(c.rejectPrompt);
                        if (note && note.trim()) review.mutate({ id: d.id, status: "rejected", note: note.trim() });
                      }}
                    >
                      <XCircle className="size-4" /> {c.reject}
                    </Button>
                  </div>
                ) : null}
                {d.review_note ? <p className="mt-2 text-xs text-destructive">{d.review_note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">{c.activity}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(data.stats ?? {})
            .filter(([, v]) => Number(v) > 0)
            .map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border/60 p-3">
                <p className="text-xs text-muted-foreground">{c.statLabels[k] ?? k}</p>
                <p className="text-lg font-bold">{v}</p>
              </div>
            ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">{c.changes}</h2>
        {data.change_requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{c.none}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {data.change_requests.map((r) => (
              <li key={r.id}>
                {r.field} → {r.new_value} · {r.status} · {formatDate(r.created_at, lang)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">{c.log}</h2>
        {data.change_log.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{c.none}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {data.change_log.map((l) => (
              <li key={l.id}>
                {formatDateTime(l.created_at, lang)} · {l.field}: {l.old_value ?? "—"} → {l.new_value ?? "—"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">{c.reports}</h2>
        {data.reports.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{c.none}</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {data.reports.map((r) => (
              <li key={r.id}>
                {r.category} · {r.status} · {formatDate(r.created_at, lang)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
