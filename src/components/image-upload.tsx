import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { removeImage, uploadImage, useImageUrl, validateImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

const TXT = {
  ar: {
    change: "تغيير الصورة",
    upload: "رفع صورة",
    remove: "إزالة",
    uploading: "جارٍ الرفع...",
    hint: "JPG أو PNG أو WEBP · حتى 5 ميغابايت",
    done: "تم رفع الصورة، لا تنسَ الحفظ",
    failed: "تعذّر رفع الصورة",
  },
  en: {
    change: "Change photo",
    upload: "Upload photo",
    remove: "Remove",
    uploading: "Uploading...",
    hint: "JPG, PNG or WEBP · up to 5MB",
    done: "Photo uploaded — remember to save",
    failed: "Could not upload the photo",
  },
} as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  fallback?: string;
  prefix?: string;
  rounded?: "full" | "xl";
  className?: string;
};

export function ImageUpload({
  value,
  onChange,
  fallback = "?",
  prefix = "avatar",
  rounded = "xl",
  className,
}: Props) {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const url = useImageUrl(value);

  const pick = async (file: File | undefined) => {
    if (!file || !user) return;
    try {
      validateImage(file, lang);
      setBusy(true);
      const path = await uploadImage(user.id, file, prefix);
      if (value) await removeImage(value);
      onChange(path);
      toast.success(c.done);
    } catch (e) {
      toast.error((e as Error).message || c.failed);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const shape = rounded === "full" ? "rounded-full" : "rounded-2xl";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={value ? c.change : c.upload}
        className={cn(
          "group relative flex size-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-primary/10 font-display text-2xl font-extrabold text-primary transition hover:border-primary",
          shape,
        )}
      >
        {url ? (
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <span>{fallback}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 text-background opacity-0 transition group-hover:opacity-100">
          <Camera className="size-5" />
        </span>
      </button>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" disabled={busy}
            onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" /> {busy ? c.uploading : value ? c.change : c.upload}
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" disabled={busy}
              onClick={async () => {
                await removeImage(value);
                onChange("");
              }}>
              <Trash2 className="size-4" /> {c.remove}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{c.hint}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
