import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/my-shifts")({
  beforeLoad: () => {
    throw redirect({ to: "/activity", search: { tab: "shifts" }, replace: true });
  },
});
