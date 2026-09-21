import { BadgeCheck, type LucideIcon } from "lucide-react";
import { useImageUrl } from "@/lib/storage";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  value?: string | null;
  alt?: string;
  icon?: LucideIcon;
  fallbackText?: string;
  className?: string;
  iconClassName?: string;
  /** يضيف شارة «موثّق» صغيرة على حافة الصورة. */
  verified?: boolean;
};

/** Shows a stored avatar/logo (object path or URL) with an icon or letter fallback. */
export function RemoteAvatar({
  value,
  alt = "",
  icon: Icon,
  fallbackText,
  className,
  iconClassName,
  verified = false,
}: Props) {
  const url = useImageUrl(value);
  const { lang } = useLang();
  const avatar = (
    <span
      className={cn(
        "grid place-items-center overflow-hidden rounded-lg bg-primary/10 font-display font-extrabold text-primary",
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

  if (!verified) return avatar;
  return (
    <span className="relative inline-flex shrink-0">
      {avatar}
      <BadgeCheck
        aria-label={lang === "ar" ? "موثّق" : "Verified"}
        className="absolute -bottom-1 -end-1 size-4 rounded-full bg-card text-accent"
      />
    </span>
  );
}
