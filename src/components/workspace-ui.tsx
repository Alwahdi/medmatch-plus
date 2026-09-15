import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export function WorkspaceHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-semibold text-primary">{eyebrow}</p>}
        <h1 className="mt-1 truncate text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function NextStepCard({
  icon: Icon,
  label,
  title,
  description,
  action,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "primary" | "accent" | "warning";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent text-accent-foreground"
      : tone === "warning"
        ? "bg-warning text-warning-foreground"
        : "bg-primary text-primary-foreground";

  return (
    <section className={cn("relative overflow-hidden rounded-lg border border-transparent p-5 shadow-card sm:p-6", toneClass)}>
      <div className="relative z-10 grid grid-cols-[auto_minmax(0,1fr)] gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-background/15" aria-hidden>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold">{label}</p>
          <h2 className="mt-1 text-lg font-bold sm:text-xl">{title}</h2>
          {description && <p className="mt-1 text-sm leading-6">{description}</p>}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </section>
  );
}

export function QuickAction({
  icon: Icon,
  label,
  description,
  to,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  description?: string;
  to?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground" aria-hidden>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 text-start">
        <span className="block text-sm font-bold">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{description}</span>}
      </span>
    </>
  );
  const classes =
    "flex min-h-20 w-full items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-secondary/35 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  if (to) {
    return (
      <Link to={to} className={cn(buttonVariants({ variant: "outline" }), classes)}>
        {content}
      </Link>
    );
  }
  return (
    <Button type="button" variant="outline" className={classes} onClick={onClick}>
      {content}
    </Button>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="min-w-0 truncate text-lg font-bold text-foreground">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}