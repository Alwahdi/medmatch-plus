import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  CalendarClock,
  CalendarCheck2,
  CheckCircle2,
  CircleDot,
  CircleSlash,
  PauseCircle,
  Users,
} from "lucide-react";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type WorkType = "job" | "shift";

const TXT = {
  ar: {
    job: "وظيفة",
    shift: "مناوبة",
    published: "منشورة",
    closed: "مغلقة",
    filled: "اكتمل العدد",
    expired: "انتهى موعد التقديم",
    open: "متاحة",
    booked: "محجوزة",
    cancelled: "ملغاة",
    completed: "منتهية",
    applicants: (n: number) => (n === 0 ? "لا متقدمين" : n === 1 ? "متقدّم واحد" : `${n} متقدمين`),
    bookings: (n: number) => (n === 0 ? "لا حجوزات" : n === 1 ? "حجز واحد" : `${n} حجوزات`),
  },
  en: {
    job: "Job",
    shift: "Shift",
    published: "Published",
    closed: "Closed",
    expired: "Application deadline passed",
    open: "Open",
    booked: "Booked",
    cancelled: "Cancelled",
    completed: "Completed",
    applicants: (n: number) => (n === 1 ? "1 applicant" : `${n} applicants`),
    bookings: (n: number) => (n === 1 ? "1 booking" : `${n} bookings`),
  },
} as const;

/** شارة نوع العمل: أيقونة + نص صريح (لا نعتمد على اللون وحده). */
export function WorkTypeBadge({ type, className }: { type: WorkType; className?: string }) {
  const { lang } = useLang();
  const c = TXT[lang];
  const isJob = type === "job";
  const Icon = isJob ? Briefcase : CalendarClock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold",
        isJob
          ? "border border-primary/30 bg-primary/10 text-primary"
          : "border border-dashed border-accent/50 bg-accent/10 text-accent",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {isJob ? c.job : c.shift}
    </span>
  );
}

export type WorkStatus = "published" | "closed" | "expired" | "open" | "booked" | "cancelled" | "completed";

const STATUS_ICON = {
  published: CircleDot,
  open: CircleDot,
  closed: PauseCircle,
  expired: CalendarClock,
  booked: CalendarCheck2,
  cancelled: CircleSlash,
  completed: CheckCircle2,
} as const;

/** شارة الحالة: أيقونة + نص، بألوان مساندة فقط. */
export function WorkStatusBadge({ status }: { status: WorkStatus }) {
  const { lang } = useLang();
  const c = TXT[lang];
  const Icon = STATUS_ICON[status];
  const tone =
    status === "published" || status === "open"
      ? "border-success/40 bg-success/10 text-success"
      : status === "booked"
        ? "border-primary/30 bg-primary/10 text-primary"
        : status === "completed"
          ? "border-border bg-secondary text-foreground"
          : status === "cancelled"
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border bg-secondary text-muted-foreground";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold", tone)}
    >
      <Icon className="size-3.5 shrink-0" />
      {c[status]}
    </span>
  );
}

/** مؤشر المتقدمين/الحجوزات على الإعلان نفسه — أرقام حقيقية فقط. */
export function WorkCountButton({
  type,
  count,
  expanded,
  onToggle,
}: {
  type: WorkType;
  count: number;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const label = type === "job" ? c.applicants(count) : c.bookings(count);
  const content = (
    <>
      <Users className="size-4 shrink-0" />
      <span>{label}</span>
    </>
  );
  const base = "min-h-11 gap-1.5 px-2.5 text-xs";

  if (!onToggle) {
    return <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold text-muted-foreground">{content}</span>;
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-expanded={expanded}
      disabled={count === 0}
      className={cn(
        base,
        count > 0 ? "border-primary/25 bg-primary/5 text-primary hover:bg-primary/10" : "text-muted-foreground",
      )}
    >
      {content}
    </Button>
  );
}

/** بطاقة موحّدة للأعمال المنشورة (وظيفة أو مناوبة). */
export function PublishedWorkCard({
  type,
  title,
  to,
  params,
  status,
  meta,
  actions,
  children,
}: {
  type: WorkType;
  title: string;
  to: "/jobs/$jobId" | "/shifts/$shiftId";
  params: Record<string, string>;
  status: WorkStatus;
  meta: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const isJob = type === "job";
  const Icon = isJob ? Briefcase : CalendarClock;

  return (
    <article
      className={cn(
        "rounded-lg border bg-card p-4 shadow-card",
        isJob ? "border-border border-s-4 border-s-primary/70" : "border-border border-s-4 border-s-accent/70",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-lg",
              isJob ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent",
            )}
            aria-hidden
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <WorkTypeBadge type={type} />
              <WorkStatusBadge status={status} />
            </div>
            <Link
              to={to}
              params={params as never}
              className="mt-1.5 block truncate font-display text-base font-bold hover:text-primary"
            >
              {title}
            </Link>
            <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
          </div>
        </div>
        {actions && <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:flex sm:flex-wrap sm:justify-end">{actions}</div>}
      </div>
      {children && <div className="mt-4 border-t border-border pt-4">{children}</div>}
    </article>
  );
}
