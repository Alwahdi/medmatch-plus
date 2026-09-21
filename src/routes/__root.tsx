import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LanguageProvider, useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { installRecoveryProofWatcher } from "@/lib/recovery-proof";
import { useSession } from "@/lib/auth";
import { useLiveSync } from "@/lib/live-sync";
import { useHashTarget } from "@/lib/notification-link";

// نثبّت مراقب إثبات الاستعادة مبكراً قدر الإمكان حتى لا يفوتنا حدث PASSWORD_RECOVERY.
if (typeof window !== "undefined") installRecoveryProofWatcher();

function NotFoundComponent() {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-[60vh] items-center justify-center bg-background px-4 outline-none">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">{ar ? "الصفحة غير موجودة" : "Page not found"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {ar ? "الرابط الذي فتحته غير صحيح أو تم نقل الصفحة." : "That link is wrong or the page has moved."}
        </p>
        <div className="mt-6">
          <Link to="/" className={buttonVariants()}>{ar ? "العودة للرئيسية" : "Back home"}</Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  // Single reporting path: reportLovableError below. No raw console output in the browser.
  const router = useRouter();
  const { lang } = useLang();
  const ar = lang === "ar";
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-[60vh] items-center justify-center bg-background px-4 outline-none">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">{ar ? "تعذّر تحميل هذه الصفحة" : "This page didn't load"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ar ? "حدث خطأ غير متوقع. جرّب التحديث." : "Something unexpected happened. Try refreshing."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            {ar ? "إعادة المحاولة" : "Try again"}
          </Button>
          <a
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {ar ? "الرئيسية" : "Home"}
          </a>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SyndeoCare | منصة التوظيف الطبي في العالم العربي" },
      {
        name: "description",
        content:
          "منصة عربية تربط الأطباء والتمريض والصيادلة والفنيين بالمستشفيات والعيادات: وظائف دائمة، مناوبات فورية، وتوثيق تراخيص.",
      },
      { property: "og:title", content: "SyndeoCare | منصة التوظيف الطبي في العالم العربي" },
      {
        property: "og:description",
        content: "وظائف طبية ومناوبات فورية وتوثيق تراخيص للكوادر الصحية والمنشآت في المنطقة العربية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script src="/lang-boot.js" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SkipLink />
        <LanguageDocumentSync />
        <AuthSync />
        <LiveSync />
        <Outlet />
        <Toaster
          position="top-center"
          offset={{ top: "calc(env(safe-area-inset-top, 0px) + 4.75rem)" }}
          mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 4.25rem)", left: "0.75rem", right: "0.75rem" }}
        />
      </LanguageProvider>
    </QueryClientProvider>
  );
}

function SkipLink() {
  const { lang } = useLang();
  return (
    <a
      href="#main-content"
      className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform focus:translate-y-0"
    >
      {lang === "ar" ? "تخطي إلى المحتوى" : "Skip to content"}
    </a>
  );
}

function LanguageDocumentSync() {
  const { lang } = useLang();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return null;
}

/** التحديث التلقائي الحي لبيانات المستخدم الحالي في كل الشاشات. */
function LiveSync() {
  const { session } = useSession();
  useLiveSync(session?.user ?? null);
  useHashTarget();
  return null;
}

function AuthSync() {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return null;
}
