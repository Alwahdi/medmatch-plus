import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * مسار قديم محفوظ للتوافق مع روابط خارجية.
 * النسخة الحالية تجريبية بلا خطط مدفوعة، لذلك يُحوَّل دائماً إلى صفحة المنشآت.
 */
export const Route = createFileRoute("/_public/pricing")({
  beforeLoad: () => {
    throw redirect({ to: "/for-facilities", replace: true });
  },
});
