import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/facility/applicants")({
  beforeLoad: () => {
    throw redirect({ to: "/facility", search: { tab: "jobs" }, replace: true });
  },
});
