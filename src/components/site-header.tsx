import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Menu, Stethoscope } from "lucide-react";
import { AccountHub } from "@/components/account-hub";
import { NotificationBell } from "@/components/notification-bell";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

const NAV = [
  { to: "/", key: "nav.home" },
  { to: "/jobs", key: "nav.jobs" },
  { to: "/shifts", key: "nav.shifts" },
  { to: "/specialties", key: "nav.specialties" },
  { to: "/interview-questions", key: "nav.questions" },
  { to: "/guides", key: "nav.guides" },
  { to: "/pricing", key: "nav.pricing" },
  { to: "/about", key: "nav.about" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function SiteHeader() {
  const { user, loading } = useSession();
  const { data: roles } = useRoles(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { t, lang, setLang } = useLang();

  const isFacility = roles?.includes("facility");
  const homeLink = isFacility ? "/facility" : "/dashboard";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          <span className="hidden font-display text-lg font-extrabold tracking-tight sm:inline">SyndeoCare</span>
        </Link>

        <nav className="mx-2 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          {!loading && user ? (
            <NotificationBell />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              aria-label={t("lang.label")}
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            >
              <Globe className="size-4" />
              <span className="hidden xl:inline">{t("lang.switch")}</span>
            </Button>
          )}
          {!loading && user ? (
            <AccountHub />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden xl:inline-flex">
                <Link to="/auth">{t("nav.signIn")}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="hidden xl:inline-flex">
                <Link to="/register">
                  {t("nav.signUp")}
                </Link>
              </Button>
              <Button size="sm" asChild className="hidden xl:inline-flex">
                <Link to="/for-facilities">{t("nav.postJob")}</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={t("nav.menu")}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>


    </header>
      <MobileMenuSheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("nav.menu")}
        closeLabel={t("nav.menu")}
      >
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          >
            <Globe className="size-4" />
            {t("lang.switch")}
          </Button>
          {!loading && !user && (
            <>
              <Button className="w-full" asChild onClick={() => setOpen(false)}>
                <Link to="/for-facilities">{t("nav.postJob")}</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild onClick={() => setOpen(false)}>
                <Link to="/register">{t("nav.signUp")}</Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild onClick={() => setOpen(false)}>
                <Link to="/auth">{t("nav.signIn")}</Link>
              </Button>
            </>
          )}
          {!loading && user && (
            <>
              <Button variant="outline" className="w-full" asChild onClick={() => setOpen(false)}>
                <Link to={homeLink}>{t("nav.dashboard")}</Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
              >
                {t("nav.signOut")}
              </Button>
            </>
          )}
        </div>
      </MobileMenuSheet>
    </>
  );
}
