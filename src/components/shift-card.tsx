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
    <div className="card-lift rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">{shift.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-4" /> {shift.facilities?.name_ar}
          </p>
        </div>
        <Badge variant={open ? "secondary" : "outline"}>{open ? "متاحة" : "محجوزة"}</Badge>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CalendarClock className="size-4" /> {formatDateTime(shift.starts_at)}
        </p>
        <p className="flex items-center gap-2">
          <Timer className="size-4" /> {hours} ساعة · {formatMoney(Number(shift.hourly_rate), shift.currency)} للساعة
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-4" /> {shift.city}، {shift.country}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div>
          <div className="text-xs text-muted-foreground">إجمالي المناوبة</div>
          <div className="font-display text-xl font-bold text-accent">
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
