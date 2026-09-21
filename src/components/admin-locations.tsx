import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListSkeleton } from "@/components/list-skeleton";
import { supabase } from "@/integrations/supabase/client";
import { CANONICAL_COUNTRIES } from "@/lib/countries";
import { countryLabel } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { LOCATIONS_QUERY_KEY, useAllLocations, type LocationRow } from "@/lib/locations";
import { friendlyError } from "@/lib/user-errors";

const TXT = {
  ar: {
    title: "المدن والمديريات",
    subtitle: "القائمة التي تظهر للمستخدمين في النشر والبحث والملفات. إيقاف مدينة يخفيها عن الاختيار دون حذف البيانات القديمة.",
    country: "الدولة",
    search: "ابحث عن مدينة أو محافظة",
    add: "إضافة مدينة",
    edit: "تعديل",
    regionAr: "المحافظة (عربي)",
    regionEn: "المحافظة (إنجليزي)",
    cityAr: "المدينة/المديرية (عربي)",
    cityEn: "المدينة/المديرية (إنجليزي)",
    order: "الترتيب",
    active: "ظاهرة للمستخدمين",
    save: "حفظ",
    cancel: "إلغاء",
    saved: "تم الحفظ",
    failed: "تعذّر الحفظ",
    required: "أدخل اسم المدينة بالعربية والإنجليزية واسم المحافظة.",
    empty: "لا توجد مدن لهذه الدولة بعد.",
    count: (n: number) => `${n} مدينة/مديرية`,
    hidden: "مخفية",
  },
  en: {
    title: "Cities and districts",
    subtitle: "The list users see when publishing, searching and editing profiles. Hiding a city removes it from pickers without deleting existing data.",
    country: "Country",
    search: "Search a city or governorate",
    add: "Add city",
    edit: "Edit",
    regionAr: "Governorate (Arabic)",
    regionEn: "Governorate (English)",
    cityAr: "City/district (Arabic)",
    cityEn: "City/district (English)",
    order: "Order",
    active: "Visible to users",
    save: "Save",
    cancel: "Cancel",
    saved: "Saved",
    failed: "Could not save",
    required: "Enter the city name in Arabic and English, and the governorate.",
    empty: "No cities for this country yet.",
    count: (n: number) => `${n} cities/districts`,
    hidden: "Hidden",
  },
} as const;

type Draft = {
  id: string | null;
  country: string;
  region_ar: string;
  region_en: string;
  city_ar: string;
  city_en: string;
  sort_order: string;
  is_active: boolean;
};

const emptyDraft = (country: string): Draft => ({
  id: null,
  country,
  region_ar: "",
  region_en: "",
  city_ar: "",
  city_en: "",
  sort_order: "100",
  is_active: true,
});

export function AdminLocations() {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const { data: rows, isLoading } = useAllLocations();

  const [country, setCountry] = useState<string>(CANONICAL_COUNTRIES[0] ?? "اليمن");
  const [term, setTerm] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (rows ?? [])
      .filter((r) => r.country === country)
      .filter((r) =>
        !q ||
        [r.city_ar, r.city_en, r.region_ar, r.region_en].some((v) => v?.toLowerCase().includes(q)),
      );
  }, [rows, country, term]);

  const grouped = useMemo(() => {
    const map = new Map<string, LocationRow[]>();
    for (const row of list) {
      const key = lang === "en" ? row.region_en || row.region_ar : row.region_ar || row.region_en;
      const bucket = map.get(key) ?? [];
      bucket.push(row);
      map.set(key, bucket);
    }
    return [...map.entries()];
  }, [list, lang]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: LOCATIONS_QUERY_KEY });
  };

  const toggle = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.rpc("admin_set_location_active", { _id: id, _is_active: value });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(c.saved); invalidate(); },
    onError: (e: Error) => toast.error(friendlyError(e.message, lang) || c.failed),
  });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const { error } = await supabase.rpc("admin_upsert_location", {
        _id: d.id as unknown as string,
        _country: d.country,
        _region_ar: d.region_ar.trim(),
        _region_en: d.region_en.trim() || d.region_ar.trim(),
        _city_ar: d.city_ar.trim(),
        _city_en: d.city_en.trim() || d.city_ar.trim(),
        _sort_order: Number(d.sort_order) || 100,
        _is_active: d.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(c.saved); setDraft(null); invalidate(); },
    onError: (e: Error) => toast.error(friendlyError(e.message, lang) || c.failed),
  });

  return (
    <section className="space-y-4">
      <header>
        <h2 className="font-display text-lg font-extrabold">{c.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.subtitle}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="loc-country">{c.country}</label>
        <select
          id="loc-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="h-11 min-w-44 rounded-lg border border-border bg-background px-3 text-sm"
        >
          {CANONICAL_COUNTRIES.map((n) => (
            <option key={n} value={n}>{countryLabel(n, lang)}</option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={c.search}
            className="ps-9"
            aria-label={c.search}
          />
        </div>
        <Button onClick={() => setDraft(emptyDraft(country))} className="min-h-11">
          <Plus className="size-4" /> {c.add}
        </Button>
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {c.empty}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{c.count(list.length)}</p>
          <div className="space-y-4">
            {grouped.map(([region, items]) => (
              <div key={region} className="rounded-lg border border-border">
                <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2 text-sm font-bold">
                  <MapPin className="size-4 text-muted-foreground" /> {region}
                </div>
                <ul className="divide-y divide-border">
                  {items.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-center gap-3 p-3">
                      <span className="flex-1 text-sm font-medium">
                        {lang === "en" ? row.city_en || row.city_ar : row.city_ar || row.city_en}
                        {!row.is_active && (
                          <span className="ms-2 text-xs font-normal text-muted-foreground">({c.hidden})</span>
                        )}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setDraft({
                        id: row.id,
                        country: row.country,
                        region_ar: row.region_ar,
                        region_en: row.region_en,
                        city_ar: row.city_ar,
                        city_en: row.city_en,
                        sort_order: String(row.sort_order),
                        is_active: row.is_active,
                      })}>
                        {c.edit}
                      </Button>
                      <Switch
                        checked={row.is_active}
                        disabled={toggle.isPending}
                        onCheckedChange={(v) => toggle.mutate({ id: row.id, value: v })}
                        aria-label={c.active}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={!!draft} onOpenChange={(v) => { if (!v) setDraft(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? c.edit : c.add}</DialogTitle>
            <DialogDescription>{countryLabel(draft?.country ?? country, lang)}</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-3">
              {([
                ["region_ar", c.regionAr],
                ["region_en", c.regionEn],
                ["city_ar", c.cityAr],
                ["city_en", c.cityEn],
                ["sort_order", c.order],
              ] as const).map(([field, label]) => (
                <div key={field}>
                  <label className="text-sm font-semibold" htmlFor={`loc-${field}`}>{label}</label>
                  <Input
                    id={`loc-${field}`}
                    value={draft[field]}
                    inputMode={field === "sort_order" ? "numeric" : "text"}
                    onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              ))}
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>{c.active}</span>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                  aria-label={c.active}
                />
              </label>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)}>{c.cancel}</Button>
            <Button
              disabled={save.isPending}
              onClick={() => {
                if (!draft) return;
                if (!draft.city_ar.trim() || !draft.region_ar.trim()) {
                  toast.error(c.required);
                  return;
                }
                save.mutate(draft);
              }}
            >
              {save.isPending && <Loader2 className="size-4 animate-spin" />}
              {c.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
