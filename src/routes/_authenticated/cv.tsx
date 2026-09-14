import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cv")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "cv" } });
  },
});
