import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Film,
  Loader2,
  Pause,
  Play,
  Play as PlayIcon,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const CHAT_BUCKET = "chat-attachments";
export const CHAT_MAX_BYTES = 10 * 1024 * 1024;

export function formatBytes(size?: number | null) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function chatPath(conversationId: string, file: File) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-60);
  return `${conversationId}/${Date.now()}-${safe}`;
}

/**
 * Best-effort removal of an uploaded attachment whose message never got saved.
 * Failure here is never surfaced to the user — the original error matters more.
 */
export async function removeChatFile(path: string) {
  try {
    await supabase.storage.from(CHAT_BUCKET).remove([path]);
  } catch {
    /* ignored on purpose */
  }
}


/** MIME types we can infer from a known extension when the browser reports none. */
const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  txt: "text/plain",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * MediaRecorder reports values like `audio/webm;codecs=opus`, while the storage
 * bucket only allows base MIME types — so the parameters are stripped here.
 */
export function baseMime(file: File): string | null {
  const raw = (file.type || "").split(";")[0]?.trim().toLowerCase();
  if (raw) return raw;
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  return EXT_MIME[ext] ?? null;
}

/** Extensions allowed to render inline, with the MIME types each one may carry. */
const PREVIEW_EXT_MIME: Record<string, readonly string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  mp4: ["video/mp4", "audio/mp4"],
  mov: ["video/quicktime"],
  webm: ["video/webm", "audio/webm"],
  ogg: ["audio/ogg", "video/ogg"],
  oga: ["audio/ogg"],
  m4a: ["audio/mp4", "audio/x-m4a", "audio/aac"],
  mp3: ["audio/mpeg"],
  wav: ["audio/wav", "audio/x-wav"],
};

/**
 * Inline preview family. The stored MIME is canonical (written from Storage by the
 * database) and the path extension must agree with it — anything else, including
 * HTML/SVG, falls back to a plain download link.
 */
export function attachmentKind(
  path: string,
  type?: string | null,
): "image" | "audio" | "video" | "file" {
  const mime = (type ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  const ext = (path.split(".").pop() ?? "").toLowerCase();
  const allowed = PREVIEW_EXT_MIME[ext];
  if (!allowed || !allowed.includes(mime)) return "file";
  const family = mime.split("/")[0];
  if (family === "image" || family === "audio" || family === "video") return family;
  return "file";
}



/**
 * Uploads a chat attachment. When `onProgress` is provided the upload goes through
 * XHR so the UI can show a WhatsApp-style percentage ring; `signal` aborts it.
 */
export async function uploadChatFile(
  conversationId: string,
  file: File,
  options?: { onProgress?: (percent: number) => void; signal?: AbortSignal; path?: string },
) {
  const path = options?.path ?? chatPath(conversationId, file);

  const contentType = baseMime(file);
  if (!contentType) throw new Error("unsupported_file_type");

  const baseUrl = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const apiKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

  if (!options?.onProgress || !baseUrl || !apiKey || typeof XMLHttpRequest === "undefined") {
    const { error } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(path, file, { contentType });
    if (error) throw error;
    return path;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/storage/v1/object/${CHAT_BUCKET}/${path}`);
    xhr.setRequestHeader("apikey", apiKey);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("content-type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) options.onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        options.onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`upload_failed_${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("upload_failed"));
    xhr.onabort = () => reject(new DOMException("aborted", "AbortError"));
    options.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });

  return path;
}

function clock(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const BARS = [7, 12, 18, 10, 22, 14, 8, 19, 25, 13, 9, 17, 21, 11, 15, 8, 20, 12, 16, 9, 23, 14, 10, 18];
const SPEEDS = [1, 1.5, 2] as const;

/** WhatsApp-style voice note player with a waveform scrubber and speed control. */
export function VoicePlayer({ url, mine }: { url: string; mine?: boolean | undefined }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const speed = SPEEDS[speedIndex] ?? 1;

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);

  const progress = duration ? time / duration : 0;

  return (
    <div className="flex w-60 max-w-full items-center gap-2">
      <audio
        ref={ref}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
          e.currentTarget.playbackRate = speed;
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
        aria-label={playing ? (ar ? "إيقاف مؤقت" : "Pause") : ar ? "تشغيل الرسالة الصوتية" : "Play voice note"}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (el.paused) {
            el.playbackRate = speed;
            void el.play();
            setPlaying(true);
          } else {
            el.pause();
            setPlaying(false);
          }
        }}
        className="-m-1 flex size-11 shrink-0 items-center justify-center rounded-full"
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full transition",
            mine ? "bg-white/20 hover:bg-white/30" : "bg-primary/10 text-primary hover:bg-primary/20",
          )}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </span>
      </button>
      <button
        type="button"
        aria-label={ar ? "شريط تقدّم الصوت" : "Audio scrubber"}
        className="flex h-11 flex-1 items-end gap-[2px] pb-1.5"
        onClick={(e) => {
          const el = ref.current;
          if (!el || !duration) return;
          const box = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
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
      <span
        className={cn(
          "shrink-0 font-mono text-[11px] tabular-nums",
          mine ? "opacity-80" : "text-muted-foreground",
        )}
      >
        {clock(playing || time ? time : duration)}
      </span>
      <button
        type="button"
        aria-label={ar ? `سرعة التشغيل ${speed}x` : `Playback speed ${speed}x`}
        onClick={() => setSpeedIndex((i) => (i + 1) % SPEEDS.length)}
        className="-me-1 flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition",
            mine ? "bg-white/20 hover:bg-white/30" : "bg-secondary text-foreground hover:bg-secondary/70",
          )}
        >
          {speed}x
        </span>
      </button>
    </div>
  );
}

/** Fullscreen viewer for images and videos shared in chat. */
function Lightbox({
  url,
  name,
  video,
  onClose,
}: {
  url: string;
  name?: string | null | undefined;
  video?: boolean;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const ar = lang === "ar";
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
          aria-label={ar ? "تنزيل الملف" : "Download file"}
          className="flex size-11 items-center justify-center rounded-full bg-white/15 text-on-hero transition hover:bg-white/25"
        >
          <Download className="size-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label={ar ? "إغلاق العارض" : "Close viewer"}
          className="flex size-11 items-center justify-center rounded-full bg-white/15 text-on-hero transition hover:bg-white/25"
        >
          <X className="size-5" />
        </button>
      </div>
      {name && (
        <span className="absolute top-6 start-4 max-w-[60%] truncate text-sm text-on-hero/80">
          {name}
        </span>
      )}
      {video ? (
        <video
          src={url}
          controls
          autoPlay
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] max-w-full rounded-lg"
        />
      ) : (
        <img
          src={url}
          alt={name ?? ""}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[85vh] max-w-full rounded-lg object-contain"
        />
      )}
    </div>
  );
}

function fileIcon(type?: string | null, name?: string | null) {
  const value = `${type ?? ""} ${name ?? ""}`.toLowerCase();
  if (value.includes("sheet") || /\.(xlsx?|csv)$/.test(value)) return FileSpreadsheet;
  if (value.includes("zip") || value.includes("rar") || value.includes("compressed")) return FileArchive;
  if (value.includes("video")) return Film;
  return FileText;
}

function fileKind(type?: string | null, name?: string | null) {
  const ext = (name ?? "").split(".").pop();
  if (ext && ext.length <= 5 && !ext.includes("/")) return ext.toUpperCase();
  const sub = (type ?? "").split("/")[1];
  return sub ? sub.toUpperCase() : "FILE";
}

type Props = {
  path: string;
  name?: string | null;
  type?: string | null;
  size?: number | null;
  mine?: boolean;
};

export function ChatAttachment({ path, name, type, size, mine }: Props) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const { data: url, isLoading } = useQuery({
    queryKey: ["chat-file", path],
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data?.signedUrl ?? null;
    },
  });

  const kind = attachmentKind(path, type);
  const isImage = kind === "image";
  const isAudio = kind === "audio";
  const isVideo = kind === "video";


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
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={ar ? `تشغيل الفيديو ${name ?? ""}`.trim() : `Play video ${name ?? ""}`.trim()}
          className="relative block w-64 max-w-full overflow-hidden rounded-lg"
        >
          <video
            preload="metadata"
            src={`${url}#t=0.1`}
            className="max-h-72 w-full rounded-lg bg-black object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-black/55 text-on-hero">
              <PlayIcon className="size-6" />
            </span>
          </span>
          {size ? (
            <span className="absolute bottom-2 start-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-on-hero">
              {formatBytes(size)}
            </span>
          ) : null}
        </button>
        {open && <Lightbox url={url} name={name} video onClose={() => setOpen(false)} />}
      </>
    );
  }

  if (isImage) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={ar ? `عرض الصورة ${name ?? ""}`.trim() : `Open image ${name ?? ""}`.trim()}
          className="relative block w-full"
        >
          <img
            src={url}
            alt={name ?? ""}
            loading="lazy"
            className="max-h-72 w-full rounded-lg border border-border/30 object-cover transition hover:opacity-95"
          />
          {size ? (
            <span className="absolute bottom-2 start-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-on-hero">
              {formatBytes(size)}
            </span>
          ) : null}
        </button>
        {open && <Lightbox url={url} name={name} onClose={() => setOpen(false)} />}
      </>
    );
  }

  const Icon = fileIcon(type, name);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={ar ? `تنزيل ${name ?? "ملف"}` : `Download ${name ?? "file"}`}
      className={cn(
        "flex min-h-11 w-60 max-w-full items-center gap-3 rounded-lg border p-2.5 transition",
        mine ? "border-white/25 hover:bg-white/10" : "border-border bg-card hover:bg-secondary",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          mine ? "bg-white/20" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{name ?? "file"}</span>
        <span className={cn("block text-[11px]", mine ? "opacity-75" : "text-muted-foreground")}>
          {fileKind(type, name)}
          {size ? ` · ${formatBytes(size)}` : ""}
        </span>
      </span>
      <Download className="size-4 shrink-0 opacity-70" />
    </a>
  );
}
