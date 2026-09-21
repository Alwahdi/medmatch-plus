import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Briefcase,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Search,
  ShieldCheck,
} from "lucide-react";

import { AccountHub, AccountHubSidebarTrigger } from "@/components/account-hub";
import { useAccountIdentity } from "@/components/account-hub";
import { NotificationBell } from "@/components/notification-bell";
import { OfflineBanner } from "@/components/offline-banner";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Button } from "@/components/ui/button";
import { useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useUnread } from "@/lib/unread";

import { cn } from "@/lib/utils";

type Item = { to: string; key: string; icon: typeof LayoutDashboard };

/** التنقل الأساسي = وجهات عمل فقط. إجراءات الحساب كلها في مركز الحساب. */
const PRO_NAV: Item[] = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/jobs", key: "nav.jobs", icon: Briefcase },
  { to: "/activity", key: "nav.activity", icon: FileText },
  { to: "/messages", key: "nav.messages", icon: MessagesSquare },
];

const FACILITY_NAV: Item[] = [
  { to: "/facility", key: "nav.facilityHome", icon: LayoutDashboard },
  { to: "/facility/candidates", key: "nav.candidates", icon: Search },
  { to: "/messages", key: "nav.messages", icon: MessagesSquare },
];


export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const { t } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { total: unreadTotal } = useUnread(user);
  const isFacility = roles?.includes("facility");
  const items = [...(isFacility ? FACILITY_NAV : PRO_NAV)];
  if (roles?.includes("admin")) items.push({ to: "/admin", key: "nav.admin", icon: ShieldCheck });

  const { name: accountName, image: accountImage, verified: accountVerified } = useAccountIdentity();

  /** المسار النشط: مطابقة دقيقة مع تفضيل أطول مسار مطابق. */
  function isActive(to: string) {
    if (pathname === to) return true;
    if (!pathname.startsWith(`${to}/`)) return false;
    return !items.some(
      (o) => o.to !== to && o.to.length > to.length && (pathname === o.to || pathname.startsWith(`${o.to}/`)),
    );
  }



  // شريط الجوال السفلي: وجهات العمل فقط؛ الحساب والإشعارات في الرأس.
  const mobileTabs: Item[] = isFacility
    ? [
        { to: "/facility", key: "nav.facilityHome", icon: LayoutDashboard },
        { to: "/facility/candidates", key: "nav.candidates", icon: Search },
        { to: "/messages", key: "nav.messages", icon: MessagesSquare },
      ]
    : [
        { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
        { to: "/jobs", key: "nav.jobs", icon: Briefcase },
        { to: "/activity", key: "nav.activity", icon: FileText },
        { to: "/messages", key: "nav.messages", icon: MessagesSquare },
      ];

  const nav = (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = isActive(item.to);
        const Icon = item.icon;
        const badge = item.to === "/messages" ? unreadTotal : 0;
        return (
          <Link
            key={item.to}
            to={item.to}
                className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{t(item.key)}</span>
            {badge > 0 && (
              <span
                className={cn(
                  "ms-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
                   active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground",
                )}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="mt-3 border-t border-border/70 pt-3">
      <AccountHubSidebarTrigger />
    </div>
  );

  return (
    <div className="with-bottom-nav min-h-dvh bg-background">
      <OfflineBanner />
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4">
          <AccountHub
            trigger={
              <Button
                type="button"
                variant="ghost"
                aria-label={t("nav.account")}
                className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-1 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RemoteAvatar
                   value={accountImage}
                  alt={accountName}
                  fallbackText={accountName}
                  className="size-11 shrink-0 rounded-full text-sm"
                  verified={accountVerified}
                />
                <span className="hidden min-w-0 flex-col text-start sm:flex">
                  <span className="truncate text-sm font-bold leading-tight">{accountName}</span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
                  </span>
                </span>
              </Button>
            }
          />
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </header>


       <div className="mx-auto flex max-w-[1400px] gap-5 px-0 py-0 md:px-4 md:py-5 lg:gap-6 lg:px-5 lg:py-6">
        <aside className="hidden w-56 shrink-0 md:block lg:w-64">
           <div className="sticky top-24 rounded-lg border border-border bg-card p-3 shadow-card">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
            </p>
            {nav}
            {account}
          </div>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none pb-[calc(var(--app-bottom-nav)+1.5rem)] md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
         className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_color-mix(in_oklab,var(--color-foreground)_7%,transparent)] backdrop-blur md:hidden"
        aria-label={t("nav.menu")}
      >
        <div className={cn("grid", mobileTabs.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
          {mobileTabs.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const badge = item.to === "/messages" ? unreadTotal : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                        className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className={cn("size-5", active && "stroke-[2.4]")} />
                  {badge > 0 && (
                    <span className="absolute -end-2 -top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold leading-4 text-destructive-foreground">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate leading-4">{t(item.key)}</span>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
