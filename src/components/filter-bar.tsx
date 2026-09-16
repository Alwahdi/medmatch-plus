import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type ActiveFilter = { key: string; label: string; onClear: () => void };

const TXT = {
  ar: { results: (n: number) => `${n} نتيجة`, clearAll: "مسح الكل", active: "الفلاتر المفعّلة" },
  en: { results: (n: number) => `${n} results`, clearAll: "Clear all", active: "Active filters" },
} as const;

/** سطر موحّد: عدد النتائج + شرائح الفلاتر المفعّلة + مسح الكل. */
export function FilterBar({
  count,
  filters,
  onClearAll,
  className = "",
}: {
  count?: number;
  filters: ActiveFilter[];
  onClearAll: () => void;
  className?: string;
}) {
  const { lang } = useLang();
  const t = TXT[lang];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-label={t.active}>
      {typeof count === "number" && (
        <span className="text-sm font-semibold text-muted-foreground">{t.results(count)}</span>
      )}
      {filters.map((f) => (
        <Button
          key={f.key}
          type="button"
          onClick={f.onClear}
          variant="secondary"
          size="sm"
          className="min-h-11 gap-1.5 px-3 text-xs"
        >
          {f.label}
          <X className="size-4 text-muted-foreground" />
        </Button>
      ))}
      {filters.length > 0 && (
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onClearAll}>
          <RotateCcw className="size-3.5" /> {t.clearAll}
        </Button>
      )}
    </div>
  );
}
