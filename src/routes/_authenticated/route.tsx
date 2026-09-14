import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { roleHome, useRoles, useSession } from "@/lib/auth";

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
/** مسارات الإدارة فقط. */
const ADMIN_ONLY = ["/admin"];

function matches(pathname: string, list: string[]) {
  return list.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);
  const { user } = useSession();
  const { data: roles } = useRoles(user);

  useEffect(() => {
    let active = true;
    // شبكة الأمان: لا يبقى المستخدم على مؤشر التحميل إن تأخر فحص الجلسة.
    const timer = setTimeout(() => {
      if (active) void navigate({ to: "/auth", replace: true });
    }, 8000);
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        clearTimeout(timer);
        if (error || !data.user) {
          void navigate({ to: "/auth", replace: true });
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        clearTimeout(timer);
        void navigate({ to: "/auth", replace: true });
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [navigate]);


  // حارس الأدوار: كل دور يصل إلى صفحاته فقط.
  useEffect(() => {
    if (!ready || !roles) return;
    const isFacility = roles.includes("facility");
    const isAdmin = roles.includes("admin");
    const isPro = roles.includes("professional");
    const home = roleHome(roles);
    if (matches(pathname, ADMIN_ONLY) && !isAdmin) {
      void navigate({ to: home, replace: true });
      return;
    }
    if (matches(pathname, FACILITY_ONLY) && !isFacility && !isAdmin) {
      void navigate({ to: home, replace: true });
      return;
    }
    if (matches(pathname, PRO_ONLY) && !isPro && !isAdmin) {
      void navigate({ to: home, replace: true });
    }
  }, [ready, roles, pathname, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
