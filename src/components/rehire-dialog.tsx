import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Repeat2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";

const TXT = {
  ar: {
    cta: "إعادة توظيف",
    title: "إعادة توظيف نفس المختص",
    desc: (name: string) => `سنُنشئ مناوبة جديدة بنفس تفاصيل هذه المناوبة ونرسل دعوة إلى ${name}. لن يُحجز الموعد حتى يقبل الدعوة.`,
    start: "بداية المناوبة الجديدة",
    end: "نهاية المناوبة الجديدة",
    message: "رسالة للمختص (اختياري)",
    messagePh: "مثال: سعدنا بالعمل معك، نود تكرار التعاون.",
    submit: "أرسل الدعوة",
    sending: "جارٍ الإرسال...",
    cancel: "إلغاء",
    ok: "أُنشئت المناوبة وأُرسلت الدعوة",
    missing: "حدد وقت البداية والنهاية.",
    order: "يجب أن تكون النهاية بعد البداية.",
    past: "لا يمكن جدولة مناوبة في الماضي.",
  },
  en: {
    cta: "Rehire",
    title: "Rehire this professional",
    desc: (name: string) => `We'll create a new shift with the same details and invite ${name}. Nothing is booked until they accept.`,
    start: "New shift start",
    end: "New shift end",
    message: "Message (optional)",
    messagePh: "e.g. Great working with you — we'd like to book you again.",
    submit: "Send invitation",
    sending: "Sending...",
    cancel: "Cancel",
    ok: "Shift created and invitation sent",
    missing: "Choose a start and end time.",
    order: "The end time must be after the start time.",
    past: "You can't schedule a shift in the past.",
  },
} as const;

export function RehireDialog({
  shiftId,
  candidateName,
}: {
  shiftId: string;
  candidateName: string;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("rehire_shift", {
        _shift_id: shiftId,
        _starts_at: new Date(starts).toISOString(),
        _ends_at: new Date(ends).toISOString(),
        _message: message.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.ok);
      setOpen(false);
      setStarts("");
      setEnds("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e) => friendlyError(e, lang),
  });

  const onSubmit = () => {
    setErr("");
    if (!starts || !ends) return setErr(c.missing);
    const s = new Date(starts);
    const e = new Date(ends);
    if (e <= s) return setErr(c.order);
    if (s.getTime() < Date.now()) return setErr(c.past);
    submit.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Repeat2 className="size-4" aria-hidden /> {c.cta}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.desc(candidateName)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="rehire-start">{c.start}</Label>
            <Input id="rehire-start" type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="rehire-end">{c.end}</Label>
            <Input id="rehire-end" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="rehire-msg">{c.message}</Label>
            <Textarea
              id="rehire-msg"
              rows={3}
              maxLength={500}
              placeholder={c.messagePh}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{c.cancel}</Button>
          <Button onClick={onSubmit} loading={submit.isPending}>
            {submit.isPending ? c.sending : c.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
