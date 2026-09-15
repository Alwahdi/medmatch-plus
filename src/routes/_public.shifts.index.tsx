import { createFileRoute, redirect } from "@tanstack/react-router";

/** توحيد الفرص: المناوبات صارت ضمن صفحة الفرص الواحدة. */
export const Route = createFileRoute("/_public/shifts/")({
  beforeLoad: () => {
    throw redirect({ to: "/jobs", search: { kind: "shift" }, replace: true });
  },
});
