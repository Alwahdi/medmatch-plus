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
  },
} as const;

export function ShiftCard({
  shift,
  onBook,
  busy,
  actionLabel,
}: {
  shift: ShiftRow;
  onBook?: () => void;
  busy?: boolean;
  actionLabel?: string;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const hours = hoursBetween(shift.starts_at, shift.ends_at);
  const total = hours * Number(shift.hourly_rate);
  const open = shift.status === "open";

  return (
    <div className="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-5 hover:border-accent/30">
      <div className="flex flex-wrap items-center gap-2">
        {shift.is_urgent && <Badge variant="destructive">{c.urgent}</Badge>}
        <Badge
          variant={open ? "secondary" : "outline"}
          className={open ? "bg-accent/12 text-accent" : ""}
        >
          {open ? c.open : c.booked}
        </Badge>
        {shift.facility_verified && (
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="size-3" /> {c.verified}
          </Badge>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg leading-snug font-bold">{shift.title}</h3>

      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0" /> {formatDateTime(shift.starts_at, lang)}
        </p>
        <p className="flex items-center gap-2">
          <Timer className="size-4 shrink-0" /> {c.hours(hours)} ·{" "}
          {formatMoney(Number(shift.hourly_rate), shift.currency, lang)} {c.perHour}
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" /> {shift.city}، {countryLabel(shift.country, lang)}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {shift.specialties && (
            <Badge variant="outline">{specialtyName(shift.specialties, lang)}</Badge>
          )}
          {!!shift.applications_count && (
            <span className="flex items-center gap-1 text-xs">
              <Users className="size-3.5" /> {c.applied(shift.applications_count)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <div className="text-[11px] text-muted-foreground">{c.total}</div>
          <div className="font-display text-xl font-extrabold text-accent">
            {formatMoney(total, shift.currency, lang)}
          </div>
        </div>
        {onBook && (
          <Button size="sm" onClick={onBook} disabled={busy || !open}>
            {open ? (actionLabel ?? c.book) : c.booked}
          </Button>
        )}
      </div>
    </div>
  );
}
