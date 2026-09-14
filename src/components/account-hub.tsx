import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Building2,
  FileText,
  Globe,
  LogOut,
  Mail,
  ShieldCheck,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

import { RemoteAvatar } from "@/components/remote-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useMyFacility, useRoles, useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TXT = {
  ar: {
    account: "الحساب",
    open: "فتح قائمة الحساب",
    professional: "حساب مختص",
    facility: "حساب منشأة",
    myProfile: "ملفي الشخصي",
    facilityProfile: "ملف المنشأة",
    credentials: "المستندات والشهادات",
    verification: "التوثيق والمستندات",
    plan: "الباقة والاشتراك",
    invitations: "الدعوات",
    alerts: "تنبيهات الوظائف",
    notifications: "الإشعارات",
    settings: "الإعدادات",
    security: "الأمان وكلمة المرور",
    admin: "لوحة الإدارة",
    lang: "English",
    signOut: "تسجيل الخروج",
  },
  en: {
    account: "Account",
    open: "Open account menu",
    professional: "Professional account",
    facility: "Facility account",
    myProfile: "My profile",
    facilityProfile: "Facility profile",
    credentials: "Documents & credentials",
    verification: "Verification & documents",
    plan: "Plan & subscription",
    invitations: "Invitations",
    alerts: "Job alerts",
    notifications: "Notifications",
    settings: "Settings",
    security: "Security & password",
    admin: "Admin panel",
    lang: "العربية",
    signOut: "Sign out",
  },
} as const;

const ITEM =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none";

/** بيانات الحساب المشتركة بين سطح المكتب والجوال. */
export function useAccountIdentity() {
  const { user } = useSession();
  const { data: roles } = useRoles(user);
  const isFacility = !!roles?.includes("facility");
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

  const name = (isFacility ? myFacility?.name_ar : myProfile?.full_name) || user?.email || "SyndeoCare";
  const image = (isFacility ? myFacility?.logo_url : myProfile?.avatar_url) ?? null;

  return { user, roles, isFacility, name, image };
}

function AccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { lang, setLang } = useLang();
  const c = TXT[lang];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, roles, isFacility, name, image } = useAccountIdentity();

  async function signOut() {
    onNavigate();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 border-b border-border px-3 pb-3">
        <RemoteAvatar
          value={image}
          alt={name}
          fallbackText={name}
          className="size-10 shrink-0 rounded-full text-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {isFacility ? c.facility : c.professional}
            {user?.email ? ` · ${user.email}` : ""}
          </p>
        </div>
      </div>

      <div className="pt-1" />

      {isFacility ? (
        <>
          <Link to="/facility/profile" search={{ tab: "profile" }} className={ITEM} onClick={onNavigate}>
            <Building2 className="size-4 shrink-0" /> {c.facilityProfile}
          </Link>
          <Link to="/facility/profile" search={{ tab: "verification" }} className={ITEM} onClick={onNavigate}>
            <ShieldCheck className="size-4 shrink-0" /> {c.verification}
          </Link>
          <Link to="/facility/profile" search={{ tab: "plan" }} className={ITEM} onClick={onNavigate}>
            <Sparkles className="size-4 shrink-0" /> {c.plan}
          </Link>
        </>
      ) : (
        <>
          <Link to="/profile" search={{ tab: "overview" }} className={ITEM} onClick={onNavigate}>
            <UserRound className="size-4 shrink-0" /> {c.myProfile}
          </Link>
          <Link to="/profile" search={{ tab: "credentials" }} className={ITEM} onClick={onNavigate}>
            <FileText className="size-4 shrink-0" /> {c.credentials}
          </Link>
          <Link to="/invitations" className={ITEM} onClick={onNavigate}>
            <Mail className="size-4 shrink-0" /> {c.invitations}
          </Link>
          <Link to="/settings" search={{ tab: "alerts" }} className={ITEM} onClick={onNavigate}>
            <Bell className="size-4 shrink-0" /> {c.alerts}
          </Link>
        </>
      )}

      <Link to="/notifications" className={ITEM} onClick={onNavigate}>
        <Bell className="size-4 shrink-0" /> {c.notifications}
      </Link>
      <Link to="/settings" search={{ tab: "general" }} className={ITEM} onClick={onNavigate}>
        <Settings className="size-4 shrink-0" /> {c.settings}
      </Link>
      <Link to="/security" className={ITEM} onClick={onNavigate}>
        <ShieldCheck className="size-4 shrink-0" /> {c.security}
      </Link>
      {roles?.includes("admin") && (
        <Link to="/admin" className={ITEM} onClick={onNavigate}>
          <ShieldCheck className="size-4 shrink-0" /> {c.admin}
        </Link>
      )}

      <div className="mt-1 border-t border-border pt-1">
        <button type="button" className={ITEM} onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
          <Globe className="size-4 shrink-0" /> {c.lang}
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className={cn(ITEM, "text-muted-foreground hover:bg-destructive/10 hover:text-destructive")}
        >
          <LogOut className="size-4 shrink-0" /> {c.signOut}
        </button>
      </div>
    </div>
  );
}

/**
 * مركز الحساب: نقطة واحدة لكل إجراءات الحساب.
 * سطح المكتب: قائمة منسدلة — الجوال: لوحة سفلية.
 */
export function AccountHub({ trigger }: { trigger?: ReactNode }) {
  const { lang } = useLang();
  const c = TXT[lang];
  const { name, image } = useAccountIdentity();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const defaultTrigger = (
    <button
      type="button"
      aria-label={c.open}
      className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <RemoteAvatar
        value={image}
        alt={name}
        fallbackText={name}
        className="size-9 shrink-0 rounded-full text-sm"
      />
    </button>
  );

  return (
    <>
      <div className="hidden lg:block">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>{trigger ?? defaultTrigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 p-2">
            <AccountLinks onNavigate={() => setMenuOpen(false)} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
          <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl p-4">
            <SheetTitle className="sr-only">{c.account}</SheetTitle>
            <AccountLinks onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

/** زر الحساب الموسّع المستخدم في الشريط الجانبي. */
export function AccountHubSidebarTrigger() {
  const { lang, t } = useLang();
  const c = TXT[lang];
  const { name, image, isFacility } = useAccountIdentity();

  return (
    <AccountHub
      trigger={
        <button
          type="button"
          aria-label={c.open}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RemoteAvatar
            value={image}
            alt={name}
            fallbackText={name}
            className="size-9 shrink-0 rounded-full text-sm"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {t(isFacility ? "dash.facilityArea" : "dash.proArea")}
            </span>
          </span>
        </button>
      }
    />
  );
}
