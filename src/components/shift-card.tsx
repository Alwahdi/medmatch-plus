import { Link } from "@tanstack/react-router";
import { CalendarClock, MapPin, ShieldCheck, Timer, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
  countryLabel,
  formatDateTime,
  formatMoney,
  hoursBetween,
  specialtyName,
} from "@/lib/format";
import { useLang } from "@/lib/i18n";

export type ShiftRow = {
  id: string;
  title: string;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  hourly_rate: number;
  currency: string;
  country: string;
  city: string;
  status: string;
  is_urgent?: boolean | null;
  facility_verified?: boolean | null;
  applications_count?: number | null;
  specialties: { name_ar: string; name_en?: string | null } | null;
};

const TXT = {
  ar: {
    urgent: "مستعجلة",
    open: "متاحة",
    booked: "محجوزة",
    verified: "ناشر موثّق",
    hours: (n: number) => `${n} ساعة`,
    perHour: "للساعة",
    applied: (n: number) => `تقدّم ${n}`,
    total: "إجمالي المناوبة",
    book: "احجز المناوبة",
    details: "التفاصيل",
  },
  en: {
    urgent: "Urgent",
    open: "Available",
    booked: "Booked",
    verified: "Verified employer",
    hours: (n: number) => `${n} hours`,
    perHour: "per hour",
    applied: (n: number) => `${n} applied`,
    total: "Shift total",
    book: "Book this shift",
    details: "Details",

  },
} as const;

export function ShiftCard({
  shift,
  onBook,
  busy,
  actionLabel,
  mine,
  recommended,
}: {
  shift: ShiftRow;
  onBook?: () => void;
  busy?: boolean;
  actionLabel?: string;
  mine?: boolean;
  recommended?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const hours = hoursBetween(shift.starts_at, shift.ends_at);
  const total = hours * Number(shift.hourly_rate);
  const open = shift.status === "open";


  return (
    <div className="relative pt-2">
      {(shift.is_urgent || !open) && (
        <span
          className={`absolute top-0 z-10 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm start-4 ${
            shift.is_urgent && open
              ? "bg-warning text-warning-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {shift.is_urgent && open ? c.urgent : c.booked}
        </span>
      )}
      <div className="card-lift flex items-start gap-4 rounded-2xl border border-border bg-card p-4 hover:border-accent/40 sm:p-5">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground sm:size-14">
          <CalendarClock className="size-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link
              to="/shifts/$shiftId"
              params={{ shiftId: shift.id }}
              className="font-display text-base leading-snug font-bold hover:text-primary sm:text-lg"
            >
              <h3>{shift.title}</h3>
            </Link>
            {shift.facility_verified && (
              <span className="flex items-center gap-1 text-xs text-accent">
                <ShieldCheck className="size-3.5" /> {c.verified}
              </span>
            )}
          </div>


          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatDateTime(shift.starts_at, lang)}
            </span>
            {shift.specialties && (
              <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs">
                {specialtyName(shift.specialties, lang)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {countryLabel(shift.country, lang)}، {shift.city}
            </span>
            <span className="flex items-center gap-1">
              <Timer className="size-3.5" /> {c.hours(hours)} ·{" "}
              {formatMoney(Number(shift.hourly_rate), shift.currency, lang)} {c.perHour}
            </span>
            {!!shift.applications_count && (
              <span className="flex items-center gap-1 text-xs">
                <Users className="size-3.5" /> {c.applied(shift.applications_count)}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground">
              {c.total}{" "}
              <span className="font-display text-base font-extrabold text-accent">
                {formatMoney(total, shift.currency, lang)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/shifts/$shiftId" params={{ shiftId: shift.id }}>
                  {c.details}
                </Link>
              </Button>
              {onBook && (
                <Button size="sm" onClick={onBook} disabled={busy || !open}>
                  {open ? (actionLabel ?? c.book) : c.booked}
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
