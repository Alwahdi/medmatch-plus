import { useState } from "react";
import { LocateFixed, MapPin, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    title: "الموقع على الخريطة",
    hint: "يُستخدم لحساب المسافة فقط. لا يظهر موقعك الدقيق لأي طرف آخر — تظهر المسافة بالكيلومتر فقط.",
    useMine: "استخدم موقعي الحالي",
    locating: "جارٍ تحديد الموقع...",
    clear: "إزالة الموقع",
    lat: "خط العرض",
    lng: "خط الطول",
    set: "تم تحديد الموقع",
    unset: "لم يُحدَّد موقع بعد",
    denied: "لم نتمكن من قراءة موقعك. فعّل إذن الموقع في المتصفح أو أدخل الإحداثيات يدوياً.",
    unsupported: "متصفحك لا يدعم تحديد الموقع. أدخل الإحداثيات يدوياً.",
  },
  en: {
    title: "Map location",
    hint: "Used only to compute distance. Your exact location is never shown to anyone — only the distance in kilometres.",
    useMine: "Use my current location",
    locating: "Locating...",
    clear: "Remove location",
    lat: "Latitude",
    lng: "Longitude",
    set: "Location set",
    unset: "No location set yet",
    denied: "We couldn't read your location. Allow location access in your browser, or enter coordinates manually.",
    unsupported: "Your browser doesn't support location. Enter coordinates manually.",
  },
} as const;

export type LatLng = { lat: number | null; lng: number | null };

function clampLat(v: number) {
  return Math.max(-90, Math.min(90, v));
}
function clampLng(v: number) {
  return Math.max(-180, Math.min(180, v));
}

export function LocationPicker({
  value,
  onChange,
  disabled,
}: {
  value: LatLng;
  onChange: (v: LatLng) => void;
  disabled?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const locate = () => {
    setErr("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErr(c.unsupported);
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onChange({
          lat: Number(clampLat(pos.coords.latitude).toFixed(6)),
          lng: Number(clampLng(pos.coords.longitude).toFixed(6)),
        });
      },
      () => {
        setBusy(false);
        setErr(c.denied);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const hasValue = value.lat !== null && value.lng !== null;

  return (
    <div className="rounded-lg bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{c.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-card px-2 py-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          {hasValue ? c.set : c.unset}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="loc-lat">{c.lat}</Label>
          <Input
            id="loc-lat"
            dir="ltr"
            inputMode="decimal"
            disabled={disabled}
            value={value.lat ?? ""}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onChange({ ...value, lat: raw === "" ? null : clampLat(Number(raw)) });
            }}
          />
        </div>
        <div>
          <Label htmlFor="loc-lng">{c.lng}</Label>
          <Input
            id="loc-lng"
            dir="ltr"
            inputMode="decimal"
            disabled={disabled}
            value={value.lng ?? ""}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onChange({ ...value, lng: raw === "" ? null : clampLng(Number(raw)) });
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled || busy} onClick={locate}>
          <LocateFixed className="size-4" aria-hidden />
          {busy ? c.locating : c.useMine}
        </Button>
        {hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ lat: null, lng: null })}
          >
            <X className="size-4" aria-hidden />
            {c.clear}
          </Button>
        )}
      </div>

      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
}
