import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";
import { settingEnabled, usePlatformSettings, type PlatformSettingKey } from "@/lib/platform-settings";

const TXT = {
  ar: {
    title: "إعدادات المنصة",
    subtitle: "تتحكم في شروط النشر والتقديم لكل المستخدمين.",
    facility: "اشتراط توثيق المنشأة قبل النشر",
    facilityBody: "عند التفعيل، لا تستطيع المنشأة نشر وظيفة أو مناوبة قبل اعتماد مستنداتها.",
    pro: "اشتراط توثيق الكادر قبل التقديم",
    proBody: "عند التفعيل، لا يستطيع الكادر التقديم على وظيفة أو حجز مناوبة قبل اعتماد مستنداته.",
    confirmTitle: "إيقاف شرط التوثيق؟",
    confirmBody: "سيتمكن أي حساب غير موثّق من المتابعة فوراً. يبقى هذا سارياً حتى تعيد التفعيل.",
    confirmCta: "نعم، أوقف الشرط",
    cancel: "إلغاء",
    saved: "تم حفظ الإعداد",
    failed: "تعذّر حفظ الإعداد",
    loading: "جارٍ التحميل…",
  },
  en: {
    title: "Platform settings",
    subtitle: "Control publishing and application requirements for everyone.",
    facility: "Require facility verification before publishing",
    facilityBody: "When on, a facility cannot publish a job or shift until its documents are approved.",
    pro: "Require professional verification before applying",
    proBody: "When on, a professional cannot apply or book a shift until their documents are approved.",
    confirmTitle: "Turn the verification requirement off?",
    confirmBody: "Any unverified account will be able to continue immediately, until you turn it back on.",
    confirmCta: "Yes, turn it off",
    cancel: "Cancel",
    saved: "Setting saved",
    failed: "Could not save the setting",
    loading: "Loading…",
  },
} as const;

export function AdminPlatformSettings() {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const { data, isLoading } = usePlatformSettings();
  const [pendingOff, setPendingOff] = useState<PlatformSettingKey | null>(null);

  const save = useMutation({
    mutationFn: async ({ key, enabled }: { key: PlatformSettingKey; enabled: boolean }) => {
      const { error } = await supabase.rpc("admin_set_platform_setting", { _key: key, _enabled: enabled });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.saved);
      void queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  function onToggle(key: PlatformSettingKey, next: boolean) {
    if (!next) {
      setPendingOff(key);
      return;
    }
    save.mutate({ key, enabled: true });
  }

  const rows: { key: PlatformSettingKey; label: string; body: string }[] = [
    { key: "require_facility_verification", label: c.facility, body: c.facilityBody },
    { key: "require_professional_verification", label: c.pro, body: c.proBody },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h2 className="font-display text-lg font-extrabold">{c.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>

      {isLoading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {c.loading}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => {
            const on = settingEnabled(data, r.key);
            return (
              <li key={r.key} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                <div className="min-w-0">
                  <p className="font-bold">{r.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.body}</p>
                  {!on && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-warning">
                      <ShieldAlert className="size-3.5" /> {c.confirmBody}
                    </p>
                  )}
                </div>
                <Switch
                  checked={on}
                  disabled={save.isPending}
                  aria-label={r.label}
                  onCheckedChange={(next) => onToggle(r.key, next)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!pendingOff} onOpenChange={(o) => !o && setPendingOff(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{c.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{c.confirmBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingOff) save.mutate({ key: pendingOff, enabled: false });
                setPendingOff(null);
              }}
            >
              {c.confirmCta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
