/**
 * Phase 63 — production HTTP security headers.
 *
 * Applied to every server response by the request middleware in `src/start.ts`
 * and to the catastrophic-failure responses produced in `src/server.ts`.
 *
 * Rules:
 * - Never overwrite an existing Content-Type, Set-Cookie or Cache-Control header.
 * - Frame blocking and HSTS only on the real production host, so the Lovable
 *   editor preview (which renders the app inside an iframe) and localhost keep
 *   working.
 * - CSP ships as **Report-Only**. Enforcement is a release gate: the framework
 *   still emits inline hydration scripts, and production connectivity cannot be
 *   fully proven from preview. See supabase/PRIVILEGE-SAFETY.md sibling note in
 *   roadmap.md (Phase 63).
 */

const PRODUCTION_HOSTS = new Set(["syndeocare.ai", "www.syndeocare.ai"]);

/** Paths whose HTML is user-specific or security sensitive; never cached. */
const NO_STORE_PREFIXES = [
  "/auth",
  "/reset-password",
  "/mfa-challenge",
  "/dashboard",
  "/profile",
  "/cv",
  "/cv-import",
  "/credentials",
  "/applications",
  "/activity",
  "/alerts",
  "/invitations",
  "/messages",
  "/my-shifts",
  "/notifications",
  "/onboarding",
  "/preferences",
  "/saved",
  "/security",
  "/settings",
  "/admin",
  "/facility",
  "/api",
];

function supabaseOrigin(): string | null {
  const raw =
    (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : undefined) ??
    import.meta.env?.["VITE_SUPABASE_URL"];
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function buildCsp(): string {
  const backend = supabaseOrigin();
  const backendWs = backend ? backend.replace(/^https:/, "wss:") : null;

  const connect = [
    "'self'",
    backend,
    backendWs,
    // Lovable cloud auth broker (Google sign-in) + AI gateway used by CV parsing.
    "https://lovable.dev",
    "https://*.lovable.dev",
    "https://*.lovable.app",
    "https://*.lovable.cloud",
  ].filter(Boolean) as string[];

  const img = ["'self'", "data:", "blob:", backend].filter(Boolean) as string[];

  return [
    "default-src 'self'",
    // Framework hydration payloads are emitted inline by TanStack Start; a nonce
    // is not available here, so 'unsafe-inline' stays until enforcement review.
    "script-src 'self' 'unsafe-inline'",
    // Tailwind/shadcn components set inline style attributes (animations, sizing).
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `img-src ${img.join(" ")}`,
    `connect-src ${connect.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'self' https://*.lovable.dev",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join("; ");
}

function isProductionHost(url: URL): boolean {
  return url.protocol === "https:" && PRODUCTION_HOSTS.has(url.hostname);
}

function isHtml(response: Response): boolean {
  return (response.headers.get("content-type") ?? "").includes("text/html");
}

function needsNoStore(pathname: string): boolean {
  return NO_STORE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function applySecurityHeaders(request: Request, response: Response): Response {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return response;
  }

  // Response headers can be immutable (e.g. static asset responses); clone then.
  let out = response;
  try {
    out.headers.set("x-content-type-options", "nosniff");
  } catch {
    out = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
    out.headers.set("x-content-type-options", "nosniff");
  }

  const h = out.headers;
  h.set("referrer-policy", "strict-origin-when-cross-origin");
  h.set(
    "permissions-policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "browsing-topics=()",
      "interest-cohort=()",
      "payment=()",
      "usb=()",
      "serial=()",
      "midi=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "display-capture=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  );
  // Keeps the Google sign-in popup/broker window usable while isolating the app.
  h.set("cross-origin-opener-policy", "same-origin-allow-popups");

  if (isProductionHost(url)) {
    h.set("strict-transport-security", "max-age=31536000; includeSubDomains");
    // Preview/editor renders the app inside an iframe, so only block on prod.
    h.set("x-frame-options", "DENY");
  }

  if (isHtml(out)) {
    h.set("content-security-policy-report-only", buildCsp());
    if (needsNoStore(url.pathname) && !h.has("cache-control")) {
      h.set("cache-control", "no-store, max-age=0");
      h.set("pragma", "no-cache");
    }
  }

  return out;
}
