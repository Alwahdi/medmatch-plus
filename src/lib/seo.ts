/**
 * Phase 54 — canonical URLs and shared share-metadata helpers.
 *
 * كل الروابط الأساسية (canonical / og:url) تُبنى من نطاق واحد،
 * وصورة المشاركة أصل عام ثابت من هوية المنصة — لا صور مستخدمين أو منشآت.
 */

export const SITE_URL = "https://syndeocare.ai";

/** صورة المشاركة الافتراضية (1200x630) — أصل عام لا يحتوي بيانات أي مستخدم. */
export const OG_IMAGE = `${SITE_URL}/og-cover.png`;

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `${SITE_URL}/` : `${SITE_URL}${clean.replace(/\/+$/, "")}`;
}

type MetaEntry = { name?: string; property?: string; content: string; title?: string };

/** og:url + og:image + twitter:image لصفحة عامة. */
export function shareMeta(path: string, image: string = OG_IMAGE): MetaEntry[] {
  return [
    { property: "og:url", content: absoluteUrl(path) },
    { property: "og:image", content: image },
    { name: "twitter:image", content: image },
  ];
}

/** رابط canonical للصفحة (يوضع على الصفحات النهائية فقط). */
export function canonical(path: string) {
  return [{ rel: "canonical", href: absoluteUrl(path) }];
}

/** صفحات خاصة/تسجيل الدخول لا تُفهرس. */
export const NOINDEX = { name: "robots", content: "noindex,nofollow" } as const;
