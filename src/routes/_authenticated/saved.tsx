import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/saved")({
  beforeLoad: () => {
    throw redirect({ to: "/activity", search: { tab: "saved" }, replace: true });
  },
});
