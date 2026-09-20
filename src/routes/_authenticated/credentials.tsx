import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/credentials")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "credentials" }, replace: true });
  },
});
