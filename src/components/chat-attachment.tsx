import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2, Pause, Play, X } from "lucide-react";
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

function clock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const BARS = [7, 12, 18, 10, 22, 14, 8, 19, 25, 13, 9, 17, 21, 11, 15, 8, 20, 12, 16, 9, 23, 14, 10, 18];

/** WhatsApp-style voice note player with a waveform scrubber. */
function VoicePlayer({ url, mine }: { url: string; mine?: boolean | undefined }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration ? time / duration : 0;

  return (
    <div className="flex w-60 max-w-full items-center gap-3">
      <audio
        ref={ref}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (el.paused) {
            void el.play();
            setPlaying(true);
          } else {
            el.pause();
            setPlaying(false);
          }
        }}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition",
          mine ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 text-primary hover:bg-primary/20",
        )}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <button
        type="button"
        className="flex h-8 flex-1 items-end gap-[2px]"
        onClick={(e) => {
          const el = ref.current;
          if (!el || !duration) return;
          const box = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(
            1,
            Math.max(0, (e.clientX - box.left) / box.width),
          );
          const target = document.dir === "rtl" ? 1 - ratio : ratio;
          el.currentTime = target * duration;
          setTime(el.currentTime);
        }}
      >
        {BARS.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}px` }}
            className={cn(
              "w-[3px] shrink-0 rounded-full transition-colors",
              i / BARS.length <= progress
                ? mine
                  ? "bg-white"
                  : "bg-primary"
                : mine
                  ? "bg-white/35"
                  : "bg-muted-foreground/30",
            )}
          />
        ))}
      </button>
      <span className={cn("shrink-0 font-mono text-[11px] tabular-nums", mine ? "opacity-80" : "text-muted-foreground")}>
        {clock(playing || time ? time : duration)}
      </span>
    </div>
  );
}

/** Fullscreen viewer for images and videos shared in chat. */
function Lightbox({
  url,
  name,
  onClose,
}: {
  url: string;
  name?: string | null | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="absolute top-4 end-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <a
          href={url}
          download={name ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        >
          <Download className="size-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        >
          <X className="size-5" />
        </button>
      </div>
      <img
        src={url}
        alt={name ?? ""}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-xl object-contain"
      />
    </div>
  );
}

type Props = {
  path: string;
  name?: string | null;
  type?: string | null;
  size?: number | null;
  mine?: boolean;
};

export function ChatAttachment({ path, name, type, size, mine }: Props) {
  const [open, setOpen] = useState(false);
  const { data: url, isLoading } = useQuery({
    queryKey: ["chat-file", path],
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });

  const isImage = (type ?? "").startsWith("image/");
  const isAudio = (type ?? "").startsWith("audio/");
  const isVideo = (type ?? "").startsWith("video/");

  if (isLoading) {
    return (
      <span className="flex items-center gap-2 text-xs opacity-80">
        <Loader2 className="size-3.5 animate-spin" /> ...
      </span>
    );
  }
  if (!url) return null;

  if (isAudio) return <VoicePlayer url={url} mine={mine} />;

  if (isVideo) {
    return (
      <video controls preload="metadata" src={url} className="max-h-72 w-64 max-w-full rounded-xl" />
    );
  }

  if (isImage) {
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className="block w-full">
          <img
            src={url}
            alt={name ?? ""}
            loading="lazy"
            className="max-h-72 w-full rounded-xl border border-border/30 object-cover transition hover:opacity-95"
          />
        </button>
        {open && <Lightbox url={url} name={name} onClose={() => setOpen(false)} />}
      </>
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
