import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  disabled?: boolean;
  compact?: boolean;
  labels: { record: string; stop: string; cancel: string; unsupported: string; denied: string };
  onRecorded: (file: File) => void;
};

/** Records a short voice note with the microphone and returns it as an audio file. */
export function VoiceRecorder({ disabled, labels, onRecorded }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
        onRecorded(new File([blob], `voice-${Date.now()}.${ext}`, { type }));
      };
      rec.start();
      recorderRef.current = rec;
      setSeconds(0);
      setRecording(true);
    } catch {
      toast.error(labels.denied);
    }
  }

  function stop(cancel = false) {
    cancelledRef.current = cancel;
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  if (!recording) {
    return (
      <Button type="button" variant="outline" onClick={start} disabled={disabled}>
        <Mic className="size-4" /> {labels.record}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-1.5">
      <span className="size-2 animate-pulse rounded-full bg-destructive" />
      <span className="font-mono text-xs tabular-nums">{fmt(seconds)}</span>
      <Button type="button" size="sm" onClick={() => stop(false)}>
        <Square className="size-3.5" /> {labels.stop}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => stop(true)}>
        <Trash2 className="size-3.5" /> {labels.cancel}
      </Button>
    </div>
  );
}
