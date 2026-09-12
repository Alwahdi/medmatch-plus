import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const CHAT_BUCKET = "chat-attachments";
export const CHAT_MAX_BYTES = 10 * 1024 * 1024;

export function formatBytes(size?: number | null) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadChatFile(conversationId: string, file: File) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-60);
  const path = `${conversationId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from(CHAT_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

type Props = {
  path: string;
  name?: string | null;
  type?: string | null;
  size?: number | null;
  mine?: boolean;
};

export function ChatAttachment({ path, name, type, size, mine }: Props) {
  const { data: url, isLoading } = useQuery({
    queryKey: ["chat-file", path],
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });

  const isImage = (type ?? "").startsWith("image/");

  if (isLoading) {
    return (
      <span className="flex items-center gap-2 text-xs opacity-80">
        <Loader2 className="size-3.5 animate-spin" /> ...
      </span>
    );
  }
  if (!url) return null;

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={name ?? ""}
          className="max-h-64 w-full rounded-xl border border-border/40 object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition",
        mine ? "border-white/25 hover:bg-white/10" : "border-border bg-card hover:bg-secondary",
      )}
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate font-semibold">{name ?? "file"}</span>
      {size ? <span className="shrink-0 opacity-70">{formatBytes(size)}</span> : null}
      <Download className="size-3.5 shrink-0 opacity-70" />
    </a>
  );
}
