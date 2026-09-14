import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,

  CalendarClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Search,
  Settings,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { RemoteAvatar } from "@/components/remote-avatar";

import { supabase } from "@/integrations/supabase/client";
import { useMyFacility, useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { useUnread } from "@/lib/unread";

import { cn } from "@/lib/utils";

type Item = { to: string; key: string; icon: typeof LayoutDashboard };

const PRO_NAV: Item[] = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/jobs", key: "nav.jobs", icon: Briefcase },
  { to: "/shifts", key: "nav.shifts", icon: CalendarClock },
  { to: "/applications", key: "nav.applications", icon: FileText },
  { to: "/my-shifts", key: "nav.myShifts", icon: CalendarClock },
  { to: "/saved", key: "nav.saved", icon: Bookmark },
  { to: "/messages", key: "nav.messages", icon: MessagesSquare },
  { to: "/alerts", key: "nav.alerts", icon: Bell },
  { to: "/cv", key: "nav.cv", icon: FileText },
  { to: "/cv-import", key: "nav.cvImport", icon: Sparkles },
  { to: "/credentials", key: "nav.credentials", icon: ShieldCheck },
];

const FACILITY_NAV: Item[] = [
  { to: "/facility", key: "nav.facilityHome", icon: LayoutDashboard },
  { to: "/facility/verification", key: "nav.facilityVerification", icon: ShieldCheck },
  { to: "/facility/applicants", key: "nav.applicants", icon: Users },
  { to: "/facility/candidates", key: "nav.candidates", icon: Search },
  { to: "/messages", key: "nav.messages", icon: MessagesSquare },
  { to: "/pricing", key: "nav.pricing", icon: Sparkles },
];


export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const { t } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { total: unreadTotal } = useUnread(user);
  const isFacility = roles?.includes("facility");
  const items = [...(isFacility ? FACILITY_NAV : PRO_NAV)];
  if (roles?.includes("admin")) items.push({ to: "/admin", key: "nav.admin", icon: ShieldCheck });

  const { data: myFacility } = useMyFacility(user);
  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-lite", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name,avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });
  const accountName =
    (isFacility ? myFacility?.name_ar : myProfile?.full_name) || user?.email || "SyndeoCare";

  /** المسار النشط: مطابقة دقيقة مع تفضيل أطول مسار مطابق. */
  function isActive(to: string) {
    if (pathname === to) return true;
    if (!pathname.startsWith(`${to}/`)) return false;
    return !items.some(
      (o) => o.to !== to && o.to.length > to.length && (pathname === o.to || pathname.startsWith(`${o.to}/`)),
    );
  }


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Mobile bottom tab bar — Balto-style: 5 key tabs + "More" opening the full drawer
  const mobileTabs: Item[] = isFacility
    ? [
        { to: "/facility", key: "nav.facilityHome", icon: LayoutDashboard },
        { to: "/facility/applicants", key: "nav.applicants", icon: Users },
        { to: "/messages", key: "nav.messages", icon: MessagesSquare },
        { to: "/facility/candidates", key: "nav.candidates", icon: Search },
        { to: "/facility/profile", key: "nav.facilityProfile", icon: Building2 },
      ]
    : [
        { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
        { to: "/jobs", key: "nav.jobs", icon: Briefcase },
        { to: "/messages", key: "nav.messages", icon: MessagesSquare },
        { to: "/shifts", key: "nav.shifts", icon: CalendarClock },
        { to: "/profile", key: "nav.profile", icon: User },
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
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
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
                  active ? "bg-white/20 text-white" : "bg-destructive text-destructive-foreground",
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
    <div className="mt-3 space-y-1 border-t border-border/70 pt-3">
      <Link
        to={isFacility ? "/facility/profile" : "/profile"}
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-secondary"
      >
        <RemoteAvatar
          value={(isFacility ? myFacility?.logo_url : myProfile?.avatar_url) ?? null}
          alt={accountName}
          fallbackText={accountName}
          className="size-9 shrink-0 rounded-full text-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{accountName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
          </p>
        </div>
        <ChevronLeft className="ms-auto size-4 shrink-0 text-muted-foreground rtl:rotate-0 ltr:rotate-180" />
      </Link>
      <Link
        to="/settings"
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Settings className="size-4 shrink-0" />
        <span>{t("nav.settings")}</span>
        <ChevronLeft className="ms-auto size-4 rtl:rotate-0 ltr:rotate-180" />
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4 shrink-0" />
        <span>{t("nav.signOut")}</span>
      </button>
    </div>
  );


  const profileLink = isFacility ? "/facility/profile" : "/profile";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
          <Link to={profileLink} className="flex min-w-0 items-center gap-2">
            <RemoteAvatar
              value={(isFacility ? myFacility?.logo_url : myProfile?.avatar_url) ?? null}
              alt={accountName}
              fallbackText={accountName}
              className="size-9 shrink-0 rounded-full text-sm"
            />
            <span className="hidden min-w-0 flex-col sm:flex">
              <span className="truncate text-sm font-bold leading-tight">{accountName}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
              </span>
            </span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </header>

      <MobileMenuSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("nav.menu")}
        closeLabel={t("nav.menu")}
        header={
          <Link
            to={profileLink}
            onClick={() => setOpen(false)}
            className="flex min-w-0 items-center gap-3"
          >
            <RemoteAvatar
              value={(isFacility ? myFacility?.logo_url : myProfile?.avatar_url) ?? null}
              alt={accountName}
              fallbackText={accountName}
              className="size-10 shrink-0 rounded-full text-sm"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{accountName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
              </span>
            </span>
          </Link>
        }
      >
        {nav}
        {account}
      </MobileMenuSheet>


      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
            </p>
            {nav}
            {account}
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        aria-label={t("nav.menu")}
      >
        <div className="grid grid-cols-6">
          {mobileTabs.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const badge = item.to === "/messages" ? unreadTotal : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
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
                <span className="max-w-full truncate">{t(item.key)}</span>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
              open ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Menu className="size-5" />
            <span>{t("nav.menu")}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
