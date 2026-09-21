import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * شبكة أمان للتحديث التلقائي: إن لم يتصل البث الحي (شبكة ضعيفة أو حجب)،
 * نحدّث الاستعلامات النشطة كل 45 ثانية بدل ترك الشاشة قديمة.
 */
export function useLiveFallbackPolling(enabled: boolean, intervalMs = 45000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void queryClient.invalidateQueries({ refetchType: "active" });
    }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, queryClient]);
}
