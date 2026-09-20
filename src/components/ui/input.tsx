import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * حقول التاريخ/الوقت/الأرقام تُعرض دائماً باتجاه LTR: المتصفح يعرض أجزاءها
 * بترتيب مقلوب داخل صفحة عربية (مثل 212026/09/)، لذا نثبّت الاتجاه ونحاذي البداية.
 */
const LTR_TYPES = new Set(["date", "datetime-local", "time", "month", "week", "number", "tel", "url", "email"]);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, dir, ...props }, ref) => {
    const forcedLtr = !dir && !!type && LTR_TYPES.has(type);
    return (
      <input
        type={type}
        dir={dir ?? (forcedLtr ? "ltr" : undefined)}
        className={cn(
          "flex min-h-12 w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 md:text-sm",
          forcedLtr && "text-start",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
