import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import { PageChrome } from "@/components/page-chrome";
import { useSession } from "@/lib/auth";
import { resolveLanding } from "@/lib/landing";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

/** صفحات عامة لا معنى لها بعد تسجيل الدخول — يُحوَّل المستخدم للوحته. */
const GUEST_ONLY = ["/", "/auth", "/register", "/register/employer"];

function PublicLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading || !user) return;
    if (!GUEST_ONLY.includes(pathname)) return;
    let cancelled = false;
    // نعتمد على وجود الملف الفعلي لا على الدور فقط، حتى لا يُقذف حساب جديد في لوحة لا تخصّه.
    void resolveLanding(user.id).then((to) => {
      if (!cancelled) void navigate({ to, replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, pathname, navigate]);

  return (
    <PageChrome>
      <Outlet />
    </PageChrome>
  );
}
