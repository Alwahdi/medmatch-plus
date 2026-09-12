import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AVATARS_BUCKET = "avatars";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImage(file: File, lang: "ar" | "en") {
  if (!ALLOWED.includes(file.type)) {
    throw new Error(
      lang === "ar"
        ? "الصيغة غير مدعومة. استخدم JPG أو PNG أو WEBP."
        : "Unsupported format. Use JPG, PNG or WEBP.",
    );
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      lang === "ar" ? "حجم الصورة يجب ألا يتجاوز 5 ميغابايت." : "Image must be 5MB or smaller.",
    );
  }
}

/** Uploads an image into the user's own folder and returns the stored object path. */
export async function uploadImage(userId: string, file: File, prefix: string): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function removeImage(path: string) {
  if (!path || /^https?:\/\//.test(path)) return;
  await supabase.storage.from(AVATARS_BUCKET).remove([path]);
}

async function resolve(value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const { data } = await supabase.storage.from(AVATARS_BUCKET).createSignedUrl(value, 60 * 60);
  return data?.signedUrl ?? null;
}

/** Resolves a stored value (object path or absolute URL) into a displayable URL. */
export function useImageUrl(value: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["image-url", value],
    enabled: !!value,
    staleTime: 50 * 60 * 1000,
    queryFn: () => resolve(value),
  });
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return data ?? null;
}
