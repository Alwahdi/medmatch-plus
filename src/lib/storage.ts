import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AVATARS_BUCKET = "avatars";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Client-side mirror of the storage upload rules enforced in the database
 * (`public.is_allowed_upload`). Keep both lists in sync.
 */
export type UploadKind = "avatar" | "document" | "chat";

const RULES: Record<UploadKind, { ext: string[]; mime: string[]; maxBytes: number }> = {
  avatar: {
    ext: ["jpg", "jpeg", "png", "webp", "gif"],
    mime: ALLOWED,
    maxBytes: MAX_BYTES,
  },
  document: {
    ext: ["pdf", "jpg", "jpeg", "png", "webp"],
    mime: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    maxBytes: 10 * 1024 * 1024,
  },
  chat: {
    ext: [
      "pdf", "jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "ogg", "oga",
      "m4a", "mp3", "wav", "txt", "csv", "doc", "docx", "xls", "xlsx",
    ],
    mime: [
      "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif",
      "video/mp4", "video/webm", "video/quicktime",
      "audio/webm", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav",
      "audio/x-m4a", "audio/aac",
      "text/plain", "text/csv", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    maxBytes: 10 * 1024 * 1024,
  },
};

const HINT = {
  avatar: { ar: "استخدم صورة JPG أو PNG أو WEBP أو GIF.", en: "Use a JPG, PNG, WEBP or GIF image." },
  document: { ar: "استخدم ملف PDF أو صورة JPG أو PNG أو WEBP.", en: "Use a PDF file or a JPG, PNG or WEBP image." },
  chat: {
    ar: "الأنواع المدعومة: صور، فيديو، صوت، PDF، ومستندات Word/Excel/نص.",
    en: "Supported: images, video, audio, PDF and Word/Excel/text documents.",
  },
} as const;

/** Returns a translated error message, or null when the file is acceptable. */
export function checkUpload(file: File, kind: UploadKind, lang: "ar" | "en"): string | null {
  const rule = RULES[kind];
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mime = (file.type || "").split(";")[0]!.toLowerCase();
  const okExt = rule.ext.includes(ext);
  const okMime = mime === "" || rule.mime.includes(mime);
  if (!okExt || !okMime) {
    return lang === "ar"
      ? `صيغة الملف غير مدعومة. ${HINT[kind].ar}`
      : `Unsupported file format. ${HINT[kind].en}`;
  }
  if (file.size > rule.maxBytes) {
    const mb = Math.round(rule.maxBytes / (1024 * 1024));
    return lang === "ar"
      ? `حجم الملف يجب ألا يتجاوز ${mb} ميغابايت.`
      : `File must be ${mb}MB or smaller.`;
  }
  return null;
}

export function validateImage(file: File, lang: "ar" | "en") {
  const msg = checkUpload(file, "avatar", lang);
  if (msg) throw new Error(msg);
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
  const { data, error } = await supabase.storage.from(AVATARS_BUCKET).createSignedUrl(value, 60 * 60);
  if (error) throw error;
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
