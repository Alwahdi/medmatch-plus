import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Stethoscope } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, useSession } from "@/lib/auth";

const NAV = [
  { to: "/jobs", label: "الوظائف" },
  { to: "/shifts", label: "المناوبات" },
  { to: "/specialties", label: "التخصصات" },
  { to: "/for-facilities", label: "للمنشآت" },
  { to: "/pricing", label: "الأسعار" },
] as const;

export function SiteHeader() {
  const { user, loading } = useSession();
  const { data: roles } = useRoles(user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const isFacility = roles?.includes("facility");
  const homeLink = isFacility ? "/facility" : "/dashboard";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="size-5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">SyndeoCare</span>
        </Link>

        <nav className="mr-4 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-2">
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  حسابي
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to={homeLink}>لوحتي</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/messages">الرسائل</Link>
                </DropdownMenuItem>
                {isFacility && (
                  <DropdownMenuItem asChild>
                    <Link to="/facility/candidates">بحث المرشحين</Link>
                  </DropdownMenuItem>
                )}
                {!isFacility && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/profile">ملفي المهني</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/credentials">ملف الاعتماد</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/applications">طلباتي</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cv">سيرتي الذاتية</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/cv-import">بناء الملف من السيرة</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/saved">الوظائف المحفوظة</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/alerts">تنبيهات الوظائف</Link>
                    </DropdownMenuItem>
                  </>
                )}
                {roles?.includes("admin") && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">لوحة الإدارة</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>تسجيل الخروج</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/auth">تسجيل الدخول</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  إنشاء حساب
                </Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
