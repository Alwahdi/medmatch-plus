import * as ImagePicker from "expo-image-picker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";

export const AVATARS_BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;

export type AvatarTarget =
  | { kind: "professional" }
  | { kind: "facility"; facilityId: string };

/** يختار صورة من معرض الجهاز ويرفعها ويحدّث الملف. يرجع المسار الجديد أو null عند الإلغاء. */
export async function pickAndUploadAvatar(
  userId: string,
  target: AvatarTarget,
  previousPath: string | null | undefined,
): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error("permission");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    throw new Error("too_large");
  }
  const body = await (await fetch(asset.uri)).arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    throw new Error("too_large");
  }
  const ext = (asset.fileName?.split(".").pop() ?? asset.uri.split(".").pop() ?? "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5) || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const uploaded = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, body, { contentType: asset.mimeType ?? "image/jpeg", upsert: false });
  if (uploaded.error) throw uploaded.error;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", userId);
  if (profileError) throw profileError;

  if (target.kind === "professional") {
    const { error } = await supabase
      .from("healthcare_professionals")
      .update({ avatar_url: path })
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("facilities")
      .update({ logo_url: path })
      .eq("id", target.facilityId);
    if (error) throw error;
  }

  if (previousPath && !/^https?:\/\//.test(previousPath) && previousPath !== path) {
    await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
  }
  return path;
}

/** يحوّل مسار التخزين إلى رابط عرض موقّت (الحاوية خاصة). */
export function useAvatarUrl(value: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["avatar-url", value],
    enabled: Boolean(value) && !/^https?:\/\//.test(value ?? ""),
    staleTime: 50 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .createSignedUrl(value!, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return data ?? null;
}
