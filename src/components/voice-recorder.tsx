import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VoicePlayer } from "@/components/chat-attachment";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  disabled?: boolean;
  compact?: boolean;
  labels: {
    record: string;
    stop: string;
    cancel: string;
    unsupported: string;
    denied: string;
    pause?: string;
    resume?: string;
    send?: string;
    paused?: string;
  };
  onRecorded: (file: File) => void;
};

/** Records a voice note with pause/resume and a preview before sending. */
export function VoiceRecorder({ disabled, compact, labels, onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!recording || paused) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording, paused]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function clearPreview() {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
  }

  async function start() {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error(labels.unsupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelledRef.current) return;
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const ext = type.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type });
        setPreview({ file, url: URL.createObjectURL(blob) });
      };
      rec.start();
      recorderRef.current = rec;
      setSeconds(0);
      setPaused(false);
      setRecording(true);
    } catch {
      toast.error(labels.denied);
    }
  }

  function togglePause() {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === "recording") {
      rec.pause();
      setPaused(true);
    } else if (rec.state === "paused") {
      rec.resume();
      setPaused(false);
    }
  }

  function stop(cancel = false) {
    cancelledRef.current = cancel;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    setPaused(false);
  }

  if (preview) {
    return (
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5">
        <button
          type="button"
          onClick={clearPreview}
          title={labels.cancel}
          aria-label={labels.cancel}
          className="shrink-0 text-muted-foreground transition hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <VoicePlayer url={preview.url} />
        </div>
        <Button
          type="button"
          size="icon"
          title={labels.send ?? labels.stop}
          aria-label={labels.send ?? labels.stop}
          disabled={disabled}
          onClick={() => {
            onRecorded(preview.file);
            clearPreview();
          }}
          className="size-9 shrink-0 rounded-full"
        >
          <Send className="size-4" />
        </Button>
      </div>
    );
  }

  if (!recording) {
    if (compact) {
      return (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          title={labels.record}
          aria-label={labels.record}
          onClick={start}
          disabled={disabled}
          className="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        >
          <Mic className="size-5" />
        </Button>
      );
    }
    return (
      <Button type="button" variant="outline" onClick={start} disabled={disabled}>
        <Mic className="size-4" /> {labels.record}
      </Button>
    );
  }

  const pauseLabel = paused ? (labels.resume ?? labels.record) : (labels.pause ?? labels.stop);

  return (
    <div
      className={cnClass(compact)}
    >
      <button
        type="button"
        onClick={() => stop(true)}
        title={labels.cancel}
        aria-label={labels.cancel}
        className="shrink-0 text-muted-foreground transition hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
      <span
        className={`size-2 shrink-0 rounded-full bg-destructive ${paused ? "" : "animate-pulse"}`}
      />
      <span className="shrink-0 font-mono text-xs tabular-nums">{fmt(seconds)}</span>
      <span className="truncate text-xs text-muted-foreground">
        {paused ? (labels.paused ?? labels.record) : labels.record}
      </span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={togglePause}
        title={pauseLabel}
        aria-label={pauseLabel}
        className="ms-auto size-9 shrink-0 rounded-full"
      >
        {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </Button>
      <Button
        type="button"
        size="icon"
        onClick={() => stop(false)}
        title={labels.stop}
        aria-label={labels.stop}
        className="size-9 shrink-0 rounded-full"
      >
        <Square className="size-4" />
      </Button>
    </div>
  );
}

function cnClass(compact?: boolean) {
  return compact
    ? "flex flex-1 items-center gap-2 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1.5"
    : "flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5";
}
