import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { WifiOff } from "lucide-react";

import { useLang } from "@/lib/i18n";
import { useOnline } from "@/lib/network";

const TXT = {
  ar: "أنت غير متصل بالإنترنت — سنحدّث الصفحة تلقائياً عند عودة الاتصال.",
  en: "You're offline — the page will refresh itself once you're back.",
} as const;

/** شريط واحد يخبر المستخدم بسبب توقف كل شيء، ويعيد الجلب تلقائياً عند العودة. */
export function OfflineBanner() {
  const online = useOnline();
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      void queryClient.invalidateQueries();
    }
  }, [online, queryClient]);

  if (online) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning px-4 py-2 text-center text-xs font-bold text-warning-foreground"
    >
      <WifiOff className="size-4 shrink-0" />
      <span>{TXT[lang]}</span>
    </div>
  );
}
