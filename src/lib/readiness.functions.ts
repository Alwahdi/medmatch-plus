import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * حالة الجاهزية التشغيلية — قيم منطقية فقط.
 * لا تُعاد أي قيمة سرّية؛ الأسماء المذكورة هي أسماء متغيّرات الإعداد فقط.
 */
export type OperationalCheck = {
  code: string;
  severity: "blocker" | "warning" | "ok" | "info";
  ready: boolean;
  /** أسماء المتغيّرات الناقصة فقط — بلا أي قيم. */
  missing: string[];
};

export type OperationalReadiness = {
  checks: OperationalCheck[];
};

/**
 * جاهزية القنوات الخارجية والمهام المجدولة والذكاء الاصطناعي.
 * للإدارة فقط ومع التحقق بخطوتين، ويفحص الإعدادات على الخادم حصراً.
 */
export const getOperationalReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OperationalReadiness> => {
    // التحقق بخطوتين ثم صلاحية الإدارة — كلاهما من قاعدة البيانات، لا من بيانات العميل.
    const { error: mfaError } = await context.supabase.rpc("require_mfa");
    if (mfaError) throw new Error("MFA_REQUIRED");
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error("ADMIN_CHECK_FAILED");
    if (!isAdmin) throw new Error("ADMIN_REQUIRED");

    const { alertChannelStatus } = await import("./notify.server");
    const channels = alertChannelStatus();

    const present = (name: string) => {
      const v = process.env[name];
      return typeof v === "string" && v.trim().length > 0;
    };
    const missingOf = (names: string[]) => names.filter((n) => !present(n));

    const emailVars = ["RESEND_API_KEY", "ALERTS_FROM_EMAIL"];
    const whatsappVars = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_TEMPLATE_NAME"];
    const cronReady = present("LOVABLE_CRON_SECRET");
    const aiReady = present("LOVABLE_API_KEY");
    const siteUrlConfigured = present("PUBLIC_SITE_URL");

    const checks: OperationalCheck[] = [
      {
        code: "email_alerts_ready",
        // الإشعارات داخل المنصة تعمل، فغياب البريد تحذير لا مانع إطلاق.
        severity: channels.email ? "ok" : "warning",
        ready: channels.email,
        missing: channels.email ? [] : missingOf(emailVars),
      },
      {
        code: "whatsapp_alerts_ready",
        severity: channels.whatsapp ? "ok" : "warning",
        ready: channels.whatsapp,
        missing: channels.whatsapp ? [] : missingOf(whatsappVars),
      },
      {
        // بدون هذا السر لا يمكن تشغيل إرسال التنبيهات المجدول إطلاقاً.
        code: "cron_secret_configured",
        severity: cronReady ? "ok" : "blocker",
        ready: cronReady,
        missing: cronReady ? [] : ["LOVABLE_CRON_SECRET"],
      },
      {
        // إدخال الملف يدوياً يعمل، فقراءة السيرة آلياً تحسين لا شرط.
        code: "cv_ai_ready",
        severity: aiReady ? "ok" : "warning",
        ready: aiReady,
        missing: aiReady ? [] : ["LOVABLE_API_KEY"],
      },
      {
        code: "canonical_public_site_url",
        severity: siteUrlConfigured ? "ok" : "info",
        ready: siteUrlConfigured,
        missing: siteUrlConfigured ? [] : ["PUBLIC_SITE_URL"],
      },
      {
        // سياسة منتج معلنة، وليست إعداداً ناقصاً.
        code: "payments_disabled_for_trial",
        severity: "info",
        ready: true,
        missing: [],
      },
    ];

    return { checks };
  });
