import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const APP_SCHEME = "syndeocare://auth-callback";

function buildDeepLink(): string | null {
  if (typeof window === "undefined") return null;
  const search = window.location.search.replace(/^\?/, "");
  const hash = window.location.hash.replace(/^#/, "");
  const query = [search, hash].filter(Boolean).join("&");
  return query ? `${APP_SCHEME}?${query}` : APP_SCHEME;
}

function MobileAuthBridge() {
  const [link] = useState<string | null>(() => buildDeepLink());

  useEffect(() => {
    if (link) window.location.replace(link);
  }, [link]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-xl font-semibold text-foreground">جارٍ إعادتك إلى تطبيق SyndeoCare…</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Returning you to the SyndeoCare app. If nothing happens, tap the button below.
      </p>
      {link ? (
        <a
          href={link}
          className="rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          فتح التطبيق / Open the app
        </a>
      ) : null}
    </main>
  );
}

export const Route = createFileRoute("/mobile-auth")({
  component: MobileAuthBridge,
  head: () => ({
    meta: [
      { title: "العودة إلى تطبيق SyndeoCare | SyndeoCare app sign-in" },
      {
        name: "description",
        content: "صفحة إعادة توجيه آمنة تعيد إتمام تسجيل الدخول إلى تطبيق SyndeoCare على الجوال.",
      },
      { property: "og:title", content: "العودة إلى تطبيق SyndeoCare" },
      {
        property: "og:description",
        content: "إتمام تسجيل الدخول والعودة إلى تطبيق SyndeoCare على الجوال.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
