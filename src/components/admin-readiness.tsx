import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/error-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getOperationalReadiness } from "@/lib/readiness.functions";
import { useLang } from "@/lib/i18n";

type Severity = "blocker" | "warning" | "ok" | "info";

type Row = {
  code: string;
  severity: Severity;
  value: string;
  detail: string;
};

/** أسماء الفحوص كما يراها المسؤول. */
const LABEL: Record<string, { ar: string; en: string }> = {
  live_admin_count: { ar: "حسابات إدارة فعّالة", en: "Live admin accounts" },
  orphan_roles: { ar: "صلاحيات لحسابات محذوفة", en: "Roles for deleted accounts" },
  orphan_profiles: { ar: "ملفات بلا حساب (محفوظة لسجل العمل)", en: "Profiles without an account (kept for history)" },
  orphan_professionals: { ar: "ملفات كوادر بلا حساب (مخفية عن البحث)", en: "Professional profiles without an account (hidden)" },
  professional_role_without_profile: { ar: "صلاحية كادر بلا ملف", en: "Professional role without a profile" },
  facility_role_without_profile: { ar: "صلاحية منشأة بلا ملف", en: "Facility role without a profile" },
  unclaimed_facilities: {
    ar: "منشآت بلا مالك (سجلات تاريخية محفوظة ومستبعدة من العرض العام)",
    en: "Ownerless facilities (historical records kept for history, excluded from public listings)",
  },
  ownerless_public_jobs: { ar: "وظائف بلا مالك ظاهرة للعموم", en: "Ownerless jobs visible publicly" },
  ownerless_public_shifts: { ar: "مناوبات بلا مالك ظاهرة للعموم", en: "Ownerless shifts visible publicly" },
  verified_fac_without_required_docs: {
    ar: "منشآت موثّقة بمستندات ناقصة",
    en: "Verified facilities missing required documents",
  },
  verified_pro_without_required_docs: {
    ar: "كوادر موثّقة بوثائق ناقصة",
    en: "Verified professionals missing required credentials",
  },
  both_domain_profiles: { ar: "حسابات بصفتي كادر ومنشأة", en: "Accounts holding both profile types" },
  invalid_shift_duration: { ar: "مناوبات بمدة غير منطقية", en: "Shifts with an impossible duration" },
  dangerous_client_privileges: { ar: "صلاحيات خطرة لحسابات العملاء", en: "Dangerous client privileges" },
  client_tables_without_rls: { ar: "جداول بلا حماية صفوف", en: "Tables without row level security" },
  test_accounts: { ar: "حسابات اختبار متبقية", en: "Remaining test accounts" },
  email_alerts_ready: { ar: "إرسال التنبيهات بالبريد", en: "Email alert delivery" },
  whatsapp_alerts_ready: { ar: "إرسال التنبيهات عبر واتساب", en: "WhatsApp alert delivery" },
  cron_secret_configured: { ar: "مفتاح تشغيل المهام المجدولة", en: "Scheduled dispatch secret" },
  cv_ai_ready: { ar: "قراءة السيرة الذاتية آلياً", en: "Automatic CV reading" },
  canonical_public_site_url: { ar: "عنوان الموقع الرسمي", en: "Canonical public site URL" },
  payments_disabled_for_trial: { ar: "الدفع معطّل في نسخة التجربة", en: "Payments disabled for the trial launch" },
};

/** نص المعالجة — يذكر أسماء الإعدادات فقط، بلا أي قيم. */
function remediation(code: string, missing: string[], lang: "ar" | "en"): string | null {
  const names = missing.join("، ");
  switch (code) {
    case "email_alerts_ready":
      return missing.length
        ? lang === "ar"
          ? `الإشعارات داخل المنصة تعمل. لتفعيل البريد أضف الإعدادات: ${names}`
          : `In-app notifications still work. To enable email, configure: ${missing.join(", ")}`
        : null;
    case "whatsapp_alerts_ready":
      return missing.length
        ? lang === "ar"
          ? `يتطلب واتساب قالباً معتمداً. أضف الإعدادات: ${names}`
          : `WhatsApp needs an approved template. Configure: ${missing.join(", ")}`
        : null;
    case "cron_secret_configured":
      return missing.length
        ? lang === "ar"
          ? `الإرسال التلقائي للتنبيهات متوقف حتى إضافة الإعداد: ${names}`
          : `Scheduled alert dispatch stays off until you configure: ${missing.join(", ")}`
        : null;
    case "cv_ai_ready":
      return missing.length
        ? lang === "ar"
          ? `إدخال الملف يدوياً يعمل. لتفعيل القراءة الآلية أضف الإعداد: ${names}`
          : `Manual profile entry still works. For automatic reading, configure: ${missing.join(", ")}`
        : null;
    case "canonical_public_site_url":
      return missing.length
        ? lang === "ar"
          ? `يُستخدم العنوان الاحتياطي https://syndeocare.ai. لضبطه صراحةً أضف الإعداد: ${names}`
          : `Falling back to https://syndeocare.ai. To set it explicitly, configure: ${missing.join(", ")}`
        : null;
    case "payments_disabled_for_trial":
      return lang === "ar"
        ? "سياسة منتج معلنة لنسخة التجربة، وليست إعداداً ناقصاً."
        : "A stated product policy for the trial launch, not a missing setting.";
    default:
      return null;
  }
}

const GROUPS: { key: Severity; ar: string; en: string }[] = [
  { key: "blocker", ar: "موانع الإطلاق", en: "Blockers" },
  { key: "warning", ar: "تنبيهات", en: "Warnings" },
  { key: "ok", ar: "جاهز", en: "Ready" },
  { key: "info", ar: "معلومات", en: "Info" },
];

export function AdminReadiness() {
  const { lang } = useLang();

  const db = useQuery({
    queryKey: ["admin-readiness"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("release_readiness_report");
      if (error) throw error;
      return data ?? [];
    },
  });

  const ops = useQuery({
    queryKey: ["admin-readiness-ops"],
    queryFn: () => getOperationalReadiness(),
  });

  if (db.isError || ops.isError) {
    return (
      <ErrorState
        onRetry={() => {
          void db.refetch();
          void ops.refetch();
        }}
      />
    );
  }
  if (db.isPending || ops.isPending) return <ListSkeleton rows={5} />;

  const rows: Row[] = [
    ...db.data.map((r) => ({
      code: r.check_code,
      severity: (r.severity as Severity) ?? "info",
      value: String(r.value),
      detail: r.detail,
    })),
    ...ops.data.checks.map((c) => ({
      code: c.code,
      severity: c.severity,
      value:
        c.code === "payments_disabled_for_trial"
          ? lang === "ar" ? "سياسة" : "Policy"
          : c.ready
            ? lang === "ar" ? "مفعّل" : "Configured"
            : lang === "ar" ? "غير مفعّل" : "Not configured",
      detail: remediation(c.code, c.missing, lang) ?? (lang === "ar" ? "جاهز." : "Ready."),
    })),
  ];

  return (
    <div className="space-y-6">
      {GROUPS.map((g) => {
        const items = rows.filter((r) => r.severity === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key}>
            <h3 className="text-sm font-bold">{lang === "ar" ? g.ar : g.en}</h3>
            <ul className="mt-2 space-y-2">
              {items.map((r) => (
                <li
                  key={r.code}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <b className="block">{LABEL[r.code]?.[lang] ?? r.code}</b>
                    <span className="text-xs text-muted-foreground">{r.detail}</span>
                  </span>
                  <Badge
                    variant={
                      r.severity === "blocker" ? "destructive" : r.severity === "warning" ? "secondary" : "outline"
                    }
                  >
                    {r.value}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
