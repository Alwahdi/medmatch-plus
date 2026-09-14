import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSession } from "@/lib/auth";

/**
 * غلاف الصفحات العامة: الزائر يرى شريط الموقع والتذييل،
 * والمستخدم المسجّل يرى نفس الصفحة داخل إطار لوحته.
 */
export function PageChrome({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();

  if (!loading && user) return <DashboardShell>{children}</DashboardShell>;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** هل المستخدم مسجّل دخول فعلاً (بعد انتهاء فحص الجلسة). */
export function useSignedIn() {
  const { user, loading } = useSession();
  return !loading && !!user;
}
