import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Bookmark,
  Briefcase,
  CalendarClock,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
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
  { to: "/profile", key: "nav.profile", icon: User },
  { to: "/cv", key: "nav.cv", icon: FileText },
  { to: "/cv-import", key: "nav.cvImport", icon: Sparkles },
  { to: "/credentials", key: "nav.credentials", icon: ShieldCheck },
];

const FACILITY_NAV: Item[] = [
  { to: "/facility", key: "nav.facilityHome", icon: LayoutDashboard },
  { to: "/facility/profile", key: "nav.facilityProfile", icon: Building2 },

  { to: "/facility/applicants", key: "nav.applicants", icon: Users },
  { to: "/facility/candidates", key: "nav.candidates", icon: Search },
  { to: "/messages", key: "nav.messages", icon: MessagesSquare },
  { to: "/pricing", key: "nav.pricing", icon: Sparkles },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { total: unreadTotal } = useUnread(user);
  const isFacility = roles?.includes("facility");
  const items = [...(isFacility ? FACILITY_NAV : PRO_NAV)];
  if (roles?.includes("admin")) items.push({ to: "/admin", key: "nav.admin", icon: ShieldCheck });


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
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


  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t("nav.menu")}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="size-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope className="size-5" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">SyndeoCare</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              aria-label={t("lang.label")}
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            >
              <Globe className="size-4" />
              <span className="hidden sm:inline">{t("lang.switch")}</span>
            </Button>
            <Button variant="ghost" size="icon" asChild aria-label={t("nav.messages")} className="relative">
              <Link to="/messages">
                <MessagesSquare className="size-5" />
                {unreadTotal > 0 && (
                  <span className="absolute -end-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-destructive-foreground">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
              </Link>
            </Button>

            <Button variant="outline" size="sm" className="gap-1.5" onClick={signOut}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t("nav.signOut")}</span>
            </Button>
          </div>
        </div>
        {open && (
          <div className="border-t border-border bg-background px-4 py-3 lg:hidden">{nav}</div>
        )}
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
            </p>
            {nav}
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
