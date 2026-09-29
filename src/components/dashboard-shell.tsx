import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  ClipboardCheck,
  FileCheck2,
  Flag,
  Inbox,
  MapPin,
  Rocket,
  ScrollText,
  Settings2,
  Stethoscope,
  UserX,
  History,
  FilePen,
  ListChecks,
  Repeat,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Search,
} from "lucide-react";

import { AccountHub, AccountHubSidebarTrigger } from "@/components/account-hub";
import { useAccountIdentity } from "@/components/account-hub";
import { NotificationBell } from "@/components/notification-bell";
import { OfflineBanner } from "@/components/offline-banner";
import { RemoteAvatar } from "@/components/remote-avatar";
import { Button } from "@/components/ui/button";
import { useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
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


type AdminItem = { tab: string; ar: string; en: string; icon: typeof LayoutDashboard; count?: CountKey };
type CountKey = "docs" | "facdocs" | "changes" | "safety" | "inbox";

/** مساحة الإدارة: وجهات مجمّعة حسب الأولوية — القرار أولًا ثم الأشخاص ثم الإعدادات. */
export const ADMIN_GROUPS: { ar: string; en: string; items: AdminItem[] }[] = [
  { ar: "نظرة عامة", en: "Overview", items: [{ tab: "overview", ar: "ما ينتظرك", en: "Needs attention", icon: ClipboardCheck }] },
  {
    ar: "المراجعة", en: "Review",
    items: [
      { tab: "docs", ar: "وثائق الكوادر", en: "Professional documents", icon: FileCheck2, count: "docs" },
      { tab: "facdocs", ar: "مستندات المنشآت", en: "Facility documents", icon: FileText, count: "facdocs" },
      { tab: "changes", ar: "طلبات تعديل البيانات", en: "Data change requests", icon: FilePen, count: "changes" },
      { tab: "safety", ar: "بلاغات السلامة", en: "Safety reports", icon: Flag, count: "safety" },
      { tab: "deletions", ar: "طلبات حذف الحساب", en: "Account deletion", icon: UserX },
    ],
  },
  {
    ar: "الأشخاص والتواصل", en: "People & contact",
    items: [
      { tab: "pros", ar: "الكوادر", en: "Professionals", icon: Stethoscope },
      { tab: "facilities", ar: "المنشآت", en: "Facilities", icon: Building2 },
      { tab: "inbox", ar: "رسائل التواصل", en: "Contact inbox", icon: Inbox, count: "inbox" },
    ],
  },
  {
    ar: "إعدادات المنصة", en: "Platform",
    items: [
      { tab: "locations", ar: "المدن والمديريات", en: "Cities & districts", icon: MapPin },
      { tab: "requirements", ar: "متطلبات المستندات", en: "Document requirements", icon: ListChecks },
      { tab: "legal", ar: "المحتوى القانوني", en: "Legal content", icon: ScrollText },
      { tab: "settings", ar: "إعدادات المنصة", en: "Platform settings", icon: Settings2 },
      { tab: "readiness", ar: "جاهزية الإطلاق", en: "Release readiness", icon: Rocket },
      { tab: "changelog", ar: "سجل التعديلات", en: "Change log", icon: History },
    ],
  },
];

/** عدّادات المعلّق للقائمة؛ تفشل بصمت (0) إن لم تكن الجلسة مؤكَّدة بخطوتين بعد. */
export function useAdminCounts(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-nav-counts"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Record<CountKey, number>> => {
      const head = { count: "exact" as const, head: true };
      const [docs, facdocs, changes, safety, inbox] = await Promise.all([
        supabase.from("credentials").select("id", head).eq("status", "pending"),
        supabase.from("facility_documents").select("id", head).eq("status", "pending"),
        supabase.from("profile_change_requests").select("id", head).eq("status", "pending"),
        supabase.rpc("admin_list_safety_reports"),
        supabase.from("contact_messages").select("id", head).eq("is_handled", false),
      ]);
      return {
        docs: docs.count ?? 0,
        facdocs: facdocs.count ?? 0,
        changes: changes.count ?? 0,
        safety: ((safety.data as { status: string }[] | null) ?? []).filter((r) => r.status === "open").length,
        inbox: inbox.count ?? 0,
      };
    },
  });
}

const ADMIN_MOBILE: Record<string, { ar: string; en: string }> = {
  "admin.overview": { ar: "الرئيسية", en: "Home" },
  "admin.review": { ar: "المراجعة", en: "Review" },
  "admin.people": { ar: "الأشخاص", en: "People" },
  "admin.more": { ar: "الإعدادات", en: "Settings" },
};

const WS_KEY = "syndeo.workspace";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const { t, lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { total: unreadTotal } = useUnread(user);
  const isFacility = roles?.includes("facility");
  const isAdmin = !!roles?.includes("admin");
  const hasOtherRole = !!roles?.some((r) => r === "facility" || r === "professional");
  // تفضيل عرض فقط (ليس صلاحية): المدير يرى مساحة الإدارة افتراضيًا.
  const [wsPref, setWsPref] = useState<"admin" | "work">("admin");
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem(WS_KEY) === "work") setWsPref("work");
  }, []);
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const onAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const adminMode = isAdmin && (onAdminPath || wsPref === "admin" || !hasOtherRole);
  const switchWs = (to: "admin" | "work") => {
    setWsPref(to);
    window.localStorage.setItem(WS_KEY, to);
  };
  const { data: counts } = useAdminCounts(adminMode);
  const currentTab = onAdminPath && pathname === "/admin" ? (typeof search?.["tab"] === "string" ? (search["tab"] as string) : "overview") : "";
  const items = [...(isFacility ? FACILITY_NAV : PRO_NAV)];

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
  const mobileTabs: Item[] = adminMode
    ? [
        { to: "/admin?tab=overview", key: "admin.overview", icon: ClipboardCheck },
        { to: "/admin?tab=docs", key: "admin.review", icon: FileCheck2 },
        { to: "/admin?tab=pros", key: "admin.people", icon: Stethoscope },
        { to: "/admin?tab=settings", key: "admin.more", icon: Settings2 },
      ]
    : isFacility
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

  const adminNav = (
    <nav className="space-y-4" aria-label={lang === "ar" ? "قائمة الإدارة" : "Admin menu"}>
      {ADMIN_GROUPS.map((g) => (
        <div key={g.en}>
          <p className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground">{lang === "ar" ? g.ar : g.en}</p>
          <div className="space-y-0.5">
            {g.items.map((it) => {
              const active = currentTab === it.tab;
              const n = it.count ? counts?.[it.count] ?? 0 : 0;
              const Icon = it.icon;
              return (
                <Link
                  key={it.tab}
                  to="/admin"
                  search={{ tab: it.tab }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{lang === "ar" ? it.ar : it.en}</span>
                  {n > 0 && (
                    <span className={cn("ms-auto rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground")}>
                      {n > 99 ? "99+" : n}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const wsSwitch = isAdmin && hasOtherRole ? (
    <Link
      to={adminMode ? (isFacility ? "/facility" : "/dashboard") : "/admin"}
      onClick={() => switchWs(adminMode ? "work" : "admin")}
      className="mt-3 flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <Repeat className="size-4 shrink-0" />
      {adminMode
        ? lang === "ar" ? (isFacility ? "التبديل إلى مساحة المنشأة" : "التبديل إلى مساحة الكادر") : "Switch to work space"
        : lang === "ar" ? "التبديل إلى مساحة الإدارة" : "Switch to admin"}
    </Link>
  ) : null;

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
                    {adminMode ? (lang === "ar" ? "مساحة الإدارة" : "Admin workspace") : t(isFacility ? "dash.facilityArea" : "dash.proArea")}
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
              {adminMode ? (lang === "ar" ? "مساحة الإدارة" : "Admin workspace") : t(isFacility ? "dash.facilityArea" : "dash.proArea")}
            </p>
            {adminMode ? adminNav : nav}
            {wsSwitch}
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
            const [path, qs] = item.to.split("?tab=");
            const adminTab = qs ?? null;
            const reviewTabs = ["docs", "facdocs", "changes", "safety", "deletions"];
            const peopleTabs = ["pros", "facilities", "inbox"];
            const active = adminTab
              ? currentTab === adminTab ||
                (adminTab === "docs" && reviewTabs.includes(currentTab)) ||
                (adminTab === "pros" && peopleTabs.includes(currentTab)) ||
                (adminTab === "settings" && ["locations", "requirements", "legal", "readiness", "changelog"].includes(currentTab))
              : isActive(item.to);
            const Icon = item.icon;
            const badge = item.to === "/messages" ? unreadTotal : adminTab === "docs" ? (counts?.docs ?? 0) + (counts?.facdocs ?? 0) + (counts?.changes ?? 0) + (counts?.safety ?? 0) : 0;
            return (
              <Link
                key={item.to}
                to={path}
                {...(adminTab ? { search: { tab: adminTab } } : {})}
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
                <span className="max-w-full truncate leading-4">{ADMIN_MOBILE[item.key]?.[lang] ?? t(item.key)}</span>
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
