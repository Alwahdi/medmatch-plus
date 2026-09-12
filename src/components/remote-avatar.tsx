import type { LucideIcon } from "lucide-react";
import { useImageUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Props = {
  value?: string | null;
  alt?: string;
  icon?: LucideIcon;
  fallbackText?: string;
  className?: string;
  iconClassName?: string;
};

/** Shows a stored avatar/logo (object path or URL) with an icon or letter fallback. */
export function RemoteAvatar({
  value,
  alt = "",
  icon: Icon,
  fallbackText,
  className,
  iconClassName,
}: Props) {
  const url = useImageUrl(value);
  return (
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-2xl bg-primary/10 font-display font-extrabold text-primary",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={alt} loading="lazy" className="size-full object-cover" />
      ) : Icon ? (
        <Icon className={cn("size-1/2", iconClassName)} />
      ) : (
        <span>{(fallbackText ?? "?").slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
