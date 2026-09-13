import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { roleHome, useRoles, useSession } from "@/lib/auth";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

/** صفحات عامة لا معنى لها بعد تسجيل الدخول — يُحوَّل المستخدم للوحته. */
const GUEST_ONLY = ["/", "/auth", "/register", "/register/employer"];

function PublicLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useSession();
  const { data: roles } = useRoles(user);

  useEffect(() => {
    if (loading || !user || !roles) return;
    if (!GUEST_ONLY.includes(pathname)) return;
    void navigate({ to: roleHome(roles), replace: true });
  }, [loading, user, roles, pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
