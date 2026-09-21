import { Link } from "@tanstack/react-router";

import brandMark from "@/assets/syndeocare-mark.png";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  markClassName?: string;
  labelClassName?: string;
};

export function BrandLogo({
  compact = false,
  className,
  markClassName,
  labelClassName,
}: BrandLogoProps) {
  return (
    <Link
      to="/"
      aria-label="SyndeoCare"
      className={cn("inline-flex min-w-0 items-center gap-2.5 rounded-md", className)}
    >
      <img
        src={brandMark.url}
        width={40}
        height={40}
        alt=""
        className={cn("size-9 shrink-0 object-contain", markClassName)}
      />
      {!compact && (
        <span className={cn("truncate text-lg font-bold text-foreground", labelClassName)}>
          SyndeoCare
        </span>
      )}
    </Link>
  );
}