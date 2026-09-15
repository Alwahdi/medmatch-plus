import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * مؤشر خطوات بسيط — يخبر المستخدم أين هو وماذا يتبقّى قبل التنفيذ.
 * الخطوات مصفوفة نصوص، و`current` مفهرس من صفر.
 */
export function StepIndicator({
  steps,
  current,
  className,
}: {
  steps: string[];
  current: number;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs", className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold",
                active && "bg-primary text-primary-foreground",
                done && "bg-secondary text-secondary-foreground",
                !active && !done && "text-muted-foreground",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">{i + 1}</span>
              )}
              {label}
            </span>
            {i < steps.length - 1 && <span aria-hidden="true" className="text-border">—</span>}
          </li>
        );
      })}
    </ol>
  );
}
