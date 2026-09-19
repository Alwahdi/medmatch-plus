import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { roleHome, useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

// ملاحظة: فحص الجلسة يتم بعد الترطيب (داخل المكوّن) وليس في beforeLoad،
// حتى لا يحدث تعارض Hydration عند تحويل الزائر غير المسجّل إلى /auth.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

/** مسارات الكوادر الصحية فقط. */
const PRO_ONLY = [
  "/dashboard",
  "/activity",
  "/applications",
  "/my-shifts",
  "/saved",
  "/alerts",
  "/profile",
  "/cv",
  "/cv-import",
  "/credentials",
  "/invitations",
];
/** مسارات المنشآت فقط. */
const FACILITY_ONLY = ["/facility"];
/** المسارات المسموحة لحساب جديد بلا نوع بعد (إكمال الإعداد فقط). */
const ROLELESS_ALLOWED = ["/onboarding", "/profile", "/cv-import", "/cv", "/settings", "/messages", "/notifications"];
/** مسارات الإدارة فقط. */
const ADMIN_ONLY = ["/admin"];

function matches(pathname: string, list: string[]) {
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const { lang } = useLang();
  const { user, loading: sessionLoading, error: sessionError } = useSession();
  const rolesQuery = useRoles(user);
  const { data: roles } = rolesQuery;

  useEffect(() => {
    let active = true;
    setAuthError(false);
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        // لا توجد جلسة أصلاً (زائر) — إلى صفحة الدخول، وليست رسالة عطل.
        if (!data.user) {
          void navigate({ to: "/auth", replace: true });
          return;
        }
        if (error) {
          setAuthError(true);
          return;
        }
        setReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("session") || message.includes("jwt") || message.includes("not authenticated")) {
          void navigate({ to: "/auth", replace: true });
          return;
        }
        setAuthError(true);
      });
    return () => {
      active = false;
    };
  }, [navigate, attempt]);


  // حارس الأدوار: كل دور يصل إلى صفحاته فقط.
  useEffect(() => {
    if (!ready || !roles) return;
    const isFacility = roles.includes("facility");
    const isAdmin = roles.includes("admin");
    const isPro = roles.includes("professional");
    // حساب جديد بلا نوع بعد: يُسمح له بصفحات الكادر (الملف/استيراد السيرة)
    // لأن إنشاء الملف نفسه هو ما يمنحه الدور — بدل إعادته إلى شاشة الإعداد.
    const roleless = roles.length === 0;
    const home = roleHome(roles);
    if (matches(pathname, ADMIN_ONLY) && !isAdmin) {
      void navigate({ to: home, replace: true });
      return;
    }
    if (matches(pathname, FACILITY_ONLY) && !isFacility && !isAdmin) {
      void navigate({ to: home, replace: true });
      return;
    }
    if (roleless) {
      // حساب جديد بلا نوع: فقط ما يلزم لإكمال الإعداد (الملف/استيراد السيرة).
      if (!matches(pathname, ROLELESS_ALLOWED)) {
        void navigate({ to: "/onboarding", replace: true });
      }
      return;
    }
    if (matches(pathname, PRO_ONLY) && !isPro && !isAdmin) {
      void navigate({ to: home, replace: true });
    }
  }, [ready, roles, pathname, navigate]);

  if (authError || sessionError || rolesQuery.isError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
          <p className="font-bold">{lang === "ar" ? "تعذّر التحقق من حسابك" : "We couldn't verify your account"}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "ar"
              ? "تحقق من اتصالك ثم حاول مجدداً. لن يتم تسجيل خروجك بسبب بطء الشبكة."
              : "Check your connection and try again. A slow network won't sign you out."}
          </p>
          <Button className="mt-5" onClick={() => {
            setReady(false);
            setAuthError(false);
            setAttempt((value) => value + 1);
            void rolesQuery.refetch();
          }}>
            {lang === "ar" ? "إعادة المحاولة" : "Try again"}
          </Button>
        </div>
      </div>
    );
  }

  if (!ready || sessionLoading || (user && rolesQuery.isLoading)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname.startsWith("/onboarding")) return <Outlet />;
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
