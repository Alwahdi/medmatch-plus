import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type ErrorKind = "network" | "auth" | "forbidden" | "generic";

/** تصنيف الخطأ إلى سبب يفهمه المستخدم. */
export function errorKind(error: unknown): ErrorKind {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const status = (error as { status?: number } | null)?.status;
  const code = (error as { code?: string } | null)?.code;
  if (/failed to fetch|networkerror|load failed|timeout|ERR_NETWORK/i.test(raw)) return "network";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "network";
  if (status === 401 || code === "PGRST301" || /jwt|not authenticated|invalid token/i.test(raw)) return "auth";
  if (status === 403 || code === "42501" || /permission denied|row-level security/i.test(raw)) return "forbidden";
  return "generic";
}

const TXT = {
  ar: {
    network: { title: "تعذّر تحميل البيانات", body: "يبدو أن الاتصال بالإنترنت انقطع. بياناتك محفوظة ولم يُفقد شيء." },
    auth: { title: "انتهت جلستك", body: "سجّل الدخول مرة أخرى لمتابعة ما كنت تفعله." },
    forbidden: { title: "لا تملك صلاحية عرض هذا", body: "هذه الصفحة تخص نوع حساب آخر. عُد إلى صفحتك الرئيسية." },
    generic: { title: "تعذّر تحميل البيانات", body: "حدث خلل مؤقت. أعد المحاولة، ولم يُفقد أي شيء." },
    retry: "إعادة المحاولة",
    signIn: "تسجيل الدخول",
    home: "العودة للرئيسية",
  },
  en: {
    network: { title: "Couldn't load the data", body: "Your connection seems to be down. Nothing was lost." },
    auth: { title: "Your session expired", body: "Sign in again to pick up where you left off." },
    forbidden: { title: "You can't view this", body: "This page belongs to a different account type." },
    generic: { title: "Couldn't load the data", body: "A temporary glitch. Try again — nothing was lost." },
    retry: "Try again",
    signIn: "Sign in",
    home: "Back home",
  },
} as const;

const ICONS = { network: WifiOff, auth: Lock, forbidden: Lock, generic: AlertTriangle } as const;

/** حالة خطأ واحدة لكل المنتج: سبب واضح وإجراء واحد. */
export function ErrorState({
  error,
  kind,
  title,
  description,
  onRetry,
  className,
}: {
  error?: unknown;
  kind?: ErrorKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const k = kind ?? errorKind(error);
  const Icon = ICONS[k];

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 bg-card px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <Icon className="size-7" />
      </span>
      <p className="mt-4 font-bold">{title ?? c[k].title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description ?? c[k].body}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {k === "auth" ? (
          <Button asChild>
            <Link to="/auth">{c.signIn}</Link>
          </Button>
        ) : k === "forbidden" ? (
          <Button asChild variant="secondary">
            <Link to="/">{c.home}</Link>
          </Button>
        ) : null}
        {onRetry && k !== "auth" && (
          <Button variant={k === "forbidden" ? "ghost" : "default"} onClick={onRetry}>
            <RefreshCw className="size-4" /> {c.retry}
          </Button>
        )}
      </div>
    </div>
  );
}
