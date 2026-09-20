import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { currentPushSubscription, disablePush, enablePush, pushSupported } from "@/lib/push";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";

const TXT = {
  ar: {
    title: "إشعارات المتصفح",
    body: "استلم تنبيهاً فورياً على هذا الجهاز عند وصول رسالة أو تحديث على طلبك أو مناوبتك.",
    privacy: "لا يظهر نص المحادثة في الإشعار — فقط تنبيه عام ورابط للفتح داخل المنصة.",
    on: "مفعّلة على هذا الجهاز",
    off: "غير مفعّلة على هذا الجهاز",
    unsupported: "هذا المتصفح لا يدعم إشعارات الويب. جرّب Chrome أو Edge، أو أضف المنصة إلى الشاشة الرئيسية على الآيفون.",
    denied: "الإشعارات محظورة في إعدادات المتصفح لهذا الموقع. اسمح بها ثم أعد المحاولة.",
    enabled: "تم تفعيل إشعارات هذا الجهاز",
    disabled: "تم إيقاف إشعارات هذا الجهاز",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Browser notifications",
    body: "Get an instant alert on this device when a message arrives or your application or shift is updated.",
    privacy: "Notification text never includes message content — just a short alert and a link into the platform.",
    on: "On for this device",
    off: "Off for this device",
    unsupported: "This browser doesn't support web notifications. Try Chrome or Edge, or add the app to your home screen on iPhone.",
    denied: "Notifications are blocked for this site in your browser settings. Allow them and try again.",
    enabled: "Notifications enabled on this device",
    disabled: "Notifications turned off on this device",
    retry: "Try again",
  },
} as const;

export function PushToggle() {
  const { lang } = useLang();
  const c = TXT[lang];
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!pushSupported()) {
      setSupported(false);
      return;
    }
    void currentPushSubscription().then((sub) => setOn(!!sub));
  }, []);

  const toggle = async (next: boolean) => {
    setNote("");
    setBusy(true);
    try {
      if (next) {
        const result = await enablePush();
        if (result === "unsupported") {
          setSupported(false);
          return;
        }
        if (result === "denied") {
          setNote(c.denied);
          return;
        }
        setOn(true);
        toast.success(c.enabled);
      } else {
        await disablePush();
        setOn(false);
        toast.success(c.disabled);
      }
    } catch (e) {
      friendlyError(e, lang);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BellRing className="size-5 text-primary" aria-hidden />
            <h2 className="font-bold">{c.title}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">{c.privacy}</p>
        </div>
        {supported && (
          <Switch
            checked={on}
            disabled={busy}
            aria-label={c.title}
            onCheckedChange={(v) => void toggle(v)}
          />
        )}
      </div>

      {supported ? (
        <p className="mt-3 text-xs text-muted-foreground">{on ? c.on : c.off}</p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">{c.unsupported}</p>
      )}

      {note && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-xs text-destructive">{note}</p>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void toggle(true)}>
            {c.retry}
          </Button>
        </div>
      )}
    </section>
  );
}
