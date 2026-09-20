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
    ext: ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"],
    mime: [...ALLOWED, "image/heic", "image/heif"],
    maxBytes: MAX_BYTES,
  },
  document: {
    ext: ["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"],
    mime: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
    maxBytes: 10 * 1024 * 1024,
  },
  chat: {
    ext: [
      "pdf", "jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "mp4", "webm", "mov", "ogg", "oga",
      "m4a", "mp3", "wav", "txt", "csv", "doc", "docx", "xls", "xlsx",
    ],
    mime: [
      "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif",
      "image/heic", "image/heif",
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

/** ملفات المتصفح المقترحة في نافذة الاختيار لكل نوع. */
export const ACCEPT = {
  avatar: "image/*",
  document: "application/pdf,image/*,.pdf,.heic,.heif",
  chat: "*/*",
} as const;

const HINT = {
  avatar: { ar: "استخدم صورة JPG أو PNG أو WEBP أو GIF.", en: "Use a JPG, PNG, WEBP or GIF image." },
  document: { ar: "استخدم ملف PDF أو صورة من جهازك.", en: "Use a PDF file or an image from your device." },
  chat: {
    ar: "الأنواع المدعومة: صور، فيديو، صوت، PDF، ومستندات Word/Excel/نص.",
    en: "Supported: images, video, audio, PDF and Word/Excel/text documents.",
  },
} as const;

function isHeic(file: File) {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mime = (file.type || "").toLowerCase();
  return ext === "heic" || ext === "heif" || mime.includes("heic") || mime.includes("heif");
}

function isImage(file: File) {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  return (file.type || "").startsWith("image/") || ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(ext);
}

function renamed(file: File, blob: Blob, ext: string, type: string) {
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${base}.${ext}`, { type });
}

/** يحوّل صور الآيفون (HEIC) إلى JPEG داخل المتصفح. */
async function convertHeic(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  const blob = Array.isArray(out) ? out[0]! : (out as Blob);
  return renamed(file, blob, "jpg", "image/jpeg");
}

/** يصغّر الصور الكبيرة بدل رفضها (الحد الأقصى للبُعد ومستوى الجودة ثابتان). */
async function compressImage(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) return file;
  const bitmap = await createImageBitmap(file);
  const maxSide = 2000;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  for (const quality of [0.85, 0.7, 0.55]) {
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (blob && blob.size <= maxBytes) return renamed(file, blob, "jpg", "image/jpeg");
  }
  return file;
}

/**
 * يجهّز الملف قبل الرفع: تحويل HEIC إلى JPEG وضغط الصور الكبيرة، ثم التحقق
 * النهائي من النوع والحجم. يرمي رسالة مترجمة عند رفض الملف.
 */
export async function prepareUpload(file: File, kind: UploadKind, lang: "ar" | "en"): Promise<File> {
  let out = file;
  if (isImage(file)) {
    if (isHeic(file)) {
      try {
        out = await convertHeic(file);
      } catch {
        throw new Error(
          lang === "ar"
            ? "تعذّر قراءة صورة الآيفون. جرّب تصديرها بصيغة JPG ثم أعد الرفع."
            : "We couldn't read this iPhone photo. Export it as JPG and try again.",
        );
      }
    }
    try {
      out = await compressImage(out, RULES[kind].maxBytes);
    } catch {
      /* الضغط تحسين اختياري: نُكمل بالملف الأصلي */
    }
  }
  const invalid = checkUpload(out, kind, lang);
  if (invalid) throw new Error(invalid);
  return out;
}

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

/**
 * Avatars/logos live in a private bucket. Viewers without permission (guests, or
 * parties before identity is revealed) simply get no URL, so the caller renders
 * its neutral fallback instead of surfacing a storage error.
 */
async function resolve(value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const { data, error } = await supabase.storage.from(AVATARS_BUCKET).createSignedUrl(value, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Resolves a stored value (object path or absolute URL) into a displayable URL. */
export function useImageUrl(value: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["image-url", value],
    enabled: !!value,
    staleTime: 50 * 60 * 1000,
    retry: false,
    queryFn: () => resolve(value),
  });
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return data ?? null;
}
