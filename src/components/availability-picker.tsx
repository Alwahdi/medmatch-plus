import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    title: "أيام التوفر الأسبوعية",
    hint: "اختر الأيام التي يمكنك العمل فيها. تستخدمها المنشآت لتصفية المرشحين المتاحين.",
    days: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
    short: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
    none: "لم تحدد أي يوم",
  },
  en: {
    title: "Weekly availability",
    hint: "Pick the days you can work. Facilities use this to filter available candidates.",
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    none: "No days selected",
  },
} as const;

/** Availability is stored as an array of weekday numbers (0 = Sunday). */
export function parseAvailability(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
    .sort((a, b) => a - b);
}

export function availabilityLabel(days: number[], lang: "ar" | "en") {
  const c = TXT[lang];
  if (days.length === 0) return c.none;
  return days.map((d) => c.short[d]).join("، ");
}

export function AvailabilityPicker({
  value,
  onChange,
  disabled,
}: {
  value: number[];
  onChange: (v: number[]) => void;
  disabled?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];

  const toggle = (day: number) => {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    onChange(next.sort((a, b) => a - b));
  };

  return (
    <div className="rounded-lg bg-surface p-4">
      <Label asChild>
        <p className="font-medium">{c.title}</p>
      </Label>
      <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.days.map((label, day) => {
          const on = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              onClick={() => toggle(day)}
              className={cn(
                "min-h-11 rounded-md border px-3 text-sm transition-colors disabled:opacity-50",
                on
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-surface",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
