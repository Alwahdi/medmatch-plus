import { Building2, CalendarClock, MapPin, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatMoney, hoursBetween } from "@/lib/format";

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
  facilities: { name_ar: string } | null;
  specialties: { name_ar: string } | null;
};

export function ShiftCard({
  shift,
  onBook,
  busy,
  actionLabel = "احجز المناوبة",
}: {
  shift: ShiftRow;
  onBook?: () => void;
  busy?: boolean;
  actionLabel?: string;
}) {
  const hours = hoursBetween(shift.starts_at, shift.ends_at);
  const total = hours * Number(shift.hourly_rate);
  const open = shift.status === "open";

  return (
    <div className="card-lift flex h-full flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug font-bold">{shift.title}</h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">{shift.facilities?.name_ar}</span>
          </div>
        </div>
        <Badge
          variant={open ? "secondary" : "outline"}
          className={open ? "shrink-0 bg-accent/12 text-accent" : "shrink-0"}
        >
          {open ? "متاحة" : "محجوزة"}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0" /> {formatDateTime(shift.starts_at)}
        </p>
        <p className="flex items-center gap-2">
          <Timer className="size-4 shrink-0" /> {hours} ساعة ·{" "}
          {formatMoney(Number(shift.hourly_rate), shift.currency)} للساعة
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0" /> {shift.city}، {shift.country}
        </p>
        {shift.specialties && (
          <div className="pt-1">
            <Badge variant="outline">{shift.specialties.name_ar}</Badge>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <div className="text-[11px] text-muted-foreground">إجمالي المناوبة</div>
          <div className="font-display text-xl font-extrabold text-accent">
            {formatMoney(total, shift.currency)}
          </div>
        </div>
        {onBook && (
          <Button size="sm" onClick={onBook} disabled={busy || !open}>
            {open ? actionLabel : "محجوزة"}
          </Button>
        )}
      </div>
    </div>
  );
}
