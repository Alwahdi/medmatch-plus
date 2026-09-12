import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const px = size === "md" ? "size-5" : "size-4";
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(px, i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
          />
        ))}
      </span>
      <span className="text-xs font-semibold">{value ? value.toFixed(1) : "—"}</span>
      {typeof count === "number" && <span className="text-xs text-muted-foreground">({count})</span>}
    </span>
  );
}

export function RatingInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i}`}
            onClick={() => onChange(i)}
            className="rounded-md p-1 transition-transform hover:scale-110"
          >
            <Star className={cn("size-7", i <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
          </button>
        ))}
      </div>
    </div>
  );
}
