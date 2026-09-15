import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/applications")({
  beforeLoad: () => {
    throw redirect({ to: "/activity", search: { tab: "applications" }, replace: true });
  },
});
