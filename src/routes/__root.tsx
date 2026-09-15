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

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط الذي فتحته غير صحيح أو تم نقل الصفحة.
        </p>
        <div className="mt-6">
          <Link to="/" className={buttonVariants()}>العودة للرئيسية</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">تعذّر تحميل هذه الصفحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">حدث خطأ غير متوقع. جرّب التحديث.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            إعادة المحاولة
          </Button>
          <a
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
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
      { property: "og:locale", content: "ar_AR" },
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
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        <a
          href="#main-content"
          className="fixed start-4 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform focus:translate-y-0"
        >
          تخطي إلى المحتوى
        </a>
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
        <LanguageDocumentSync />
        <AuthSync />
        <Outlet />
        <Toaster position="top-center" />
      </LanguageProvider>
    </QueryClientProvider>
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
