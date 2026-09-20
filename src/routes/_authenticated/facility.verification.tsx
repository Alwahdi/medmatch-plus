import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/facility/verification")({
  beforeLoad: () => {
    throw redirect({ to: "/facility/profile", search: { tab: "verification" }, replace: true });
  },
});
