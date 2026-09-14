import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

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
  count: number;
  filters: ActiveFilter[];
  onClearAll: () => void;
  className?: string;
}) {
  const { lang } = useLang();
  const t = TXT[lang];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-semibold text-muted-foreground">{t.results(count)}</span>
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={f.onClear}
          className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {f.label}
          <X className="size-3.5 text-muted-foreground" />
        </button>
      ))}
      {filters.length > 0 && (
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onClearAll}>
          <RotateCcw className="size-3.5" /> {t.clearAll}
        </Button>
      )}
    </div>
  );
}
