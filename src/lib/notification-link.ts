import { useCallback, useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export type ParsedAppLink = {
  to: string;
  search: Record<string, string>;
  hash?: string;
};

/**
 * يفصل رابط الإشعار (مسار + معطيات + مرساة) لأن محرّك التنقل لا يقبل
 * السلسلة كاملة داخل `to`.
 */
export function parseAppLink(link: string | null | undefined): ParsedAppLink | null {
  if (!link) return null;
  const raw = link.trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  let url: URL;
  try {
    url = new URL(raw, "http://app.local");
  } catch {
    return null;
  }
  const search: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    search[key] = value;
  });
  const hash = url.hash.replace(/^#/, "");
  return { to: url.pathname, search, ...(hash ? { hash } : {}) };
}

/** يفتح رابط إشعار داخلي بأمان؛ الروابط غير الصالحة تُتجاهل بلا كسر الصفحة. */
export function useOpenAppLink() {
  const navigate = useNavigate();
  return useCallback(
    (link: string | null | undefined) => {
      const parsed = parseAppLink(link);
      if (!parsed) return;
      try {
        void navigate({
          to: parsed.to,
          search: parsed.search,
          ...(parsed.hash ? { hash: parsed.hash } : {}),
        } as never);
      } catch {
        /* رابط لصفحة غير موجودة: نتجاهله بدل كسر التنقل */
      }
    },
    [navigate],
  );
}

/** يمرّر إلى العنصر المستهدف في الرابط ويبرزه لحظياً. */
export function useHashTarget() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    const attempt = (tries: number) => {
      if (cancelled) return;
      const el = document.getElementById(hash);
      if (!el) {
        if (tries > 0) window.setTimeout(() => attempt(tries - 1), 250);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-background");
      }, 2600);
    };
    attempt(8);
    return () => {
      cancelled = true;
    };
  }, [hash]);
}
