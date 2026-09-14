import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { PageChrome } from "@/components/page-chrome";
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
    <PageChrome>
      <Outlet />
    </PageChrome>
  );
}
