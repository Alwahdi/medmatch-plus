import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronLeft, LogOut, Settings, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    title: "الحساب",
    settings: "الإعدادات",
    security: "الأمان",
    alerts: "التنبيهات",
    signOut: "تسجيل الخروج",
  },
  en: {
    title: "Account",
    settings: "Settings",
    security: "Security",
    alerts: "Job alerts",
    signOut: "Sign out",
  },
} as const;

/** بطاقة الحساب: الإعدادات والأمان والتنبيهات وتسجيل الخروج — بديل قائمة الجوال. */
export function AccountCard({ showAlerts = true }: { showAlerts?: boolean }) {
  const { lang } = useLang();
  const c = TXT[lang];
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const item =
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary";

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-3">
      <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {c.title}
      </p>
      <div className="space-y-1">
        <Link to="/settings" search={{ tab: "general" }} className={item}>
          <Settings className="size-4 shrink-0" />
          <span>{c.settings}</span>
          <ChevronLeft className="ms-auto size-4 text-muted-foreground ltr:rotate-180" />
        </Link>
        <Link to="/security" className={item}>
          <ShieldCheck className="size-4 shrink-0" />
          <span>{c.security}</span>
          <ChevronLeft className="ms-auto size-4 text-muted-foreground ltr:rotate-180" />
        </Link>
        {showAlerts && (
          <Link to="/settings" search={{ tab: "alerts" }} className={item}>
            <Bell className="size-4 shrink-0" />
            <span>{c.alerts}</span>
            <ChevronLeft className="ms-auto size-4 text-muted-foreground ltr:rotate-180" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className={`${item} w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive`}
        >
          <LogOut className="size-4 shrink-0" />
          <span>{c.signOut}</span>
        </button>
      </div>
    </div>
  );
}
