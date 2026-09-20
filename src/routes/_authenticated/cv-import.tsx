import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cv-import")({
  beforeLoad: () => {
    throw redirect({ to: "/profile", search: { tab: "cv-import" }, replace: true });
  },
});
