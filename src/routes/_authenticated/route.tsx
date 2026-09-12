import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";

// ملاحظة: فحص الجلسة يتم بعد الترطيب (داخل المكوّن) وليس في beforeLoad،
// حتى لا يحدث تعارض Hydration عند تحويل الزائر غير المسجّل إلى /auth.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        void navigate({ to: "/auth", replace: true });
        return;
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

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
