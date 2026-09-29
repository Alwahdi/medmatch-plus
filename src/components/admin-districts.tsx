import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { friendlyError } from "@/lib/user-errors";

type Draft = { id: string | null; city_location_id: string; name_ar: string; name_en: string; is_active: boolean; sort_order: number };
export function AdminDistricts() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [cityId, setCityId] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const cities = useQuery({ queryKey: ["admin-district-cities"], queryFn: async () => { const { data, error } = await supabase.from("locations").select("id,country,city_ar,city_en").eq("is_active", true).order("city_ar"); if (error) throw error; return data; } });
  const districts = useQuery({ queryKey: ["admin-districts", cityId], enabled: !!cityId, queryFn: async () => { const { data, error } = await supabase.from("districts").select("id,city_location_id,name_ar,name_en,sort_order,is_active").eq("city_location_id", cityId).order("sort_order"); if (error) throw error; return data; } });
  const save = useMutation({ mutationFn: async (item: Draft) => { const { error } = await supabase.rpc("admin_upsert_district", { _id: item.id, _city_location_id: item.city_location_id, _name_ar: item.name_ar, _name_en: item.name_en, _sort_order: item.sort_order, _is_active: item.is_active }); if (error) throw error; }, onSuccess: () => { setDraft(null); toast.success(lang === "ar" ? "حُفظت المديرية" : "District saved"); void qc.invalidateQueries({ queryKey: ["admin-districts"] }); }, onError: (error) => toast.error(friendlyError(error, lang)) });
  return <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
    <div><h2 className="text-lg font-bold">{lang === "ar" ? "مديريات المدينة" : "City districts"}</h2><p className="text-sm text-muted-foreground">{lang === "ar" ? "المدينة مستقلة؛ المديرية اختيارية في الفرص وتظهر فقط تحت المدينة المختارة." : "City remains separate; district is optional on listings and belongs to the selected city."}</p></div>
    <div className="space-y-2"><Label htmlFor="district-city">{lang === "ar" ? "المدينة" : "City"}</Label><select id="district-city" value={cityId} onChange={(e) => { setCityId(e.target.value); setDraft(null); }} className="h-11 w-full rounded-lg border bg-background px-3"><option value="">{lang === "ar" ? "اختر مدينة" : "Choose city"}</option>{cities.data?.map((c) => <option key={c.id} value={c.id}>{c.country} · {lang === "ar" ? c.city_ar : c.city_en}</option>)}</select>{cities.isError ? <Button variant="outline" onClick={() => void cities.refetch()}>{lang === "ar" ? "إعادة المحاولة" : "Retry"}</Button> : null}</div>
    {cityId ? <><Button variant="outline" onClick={() => setDraft({ id: null, city_location_id: cityId, name_ar: "", name_en: "", is_active: true, sort_order: 0 })}>{lang === "ar" ? "إضافة مديرية" : "Add district"}</Button>{districts.isError ? <Button variant="outline" onClick={() => void districts.refetch()}>{lang === "ar" ? "إعادة المحاولة" : "Retry"}</Button> : districts.data?.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border p-3"><span>{lang === "ar" ? row.name_ar : row.name_en}{!row.is_active ? ` · ${lang === "ar" ? "موقوفة" : "Inactive"}` : ""}</span><Button variant="outline" onClick={() => setDraft(row)}>{lang === "ar" ? "تعديل" : "Edit"}</Button></div>)}
    {draft ? <div className="space-y-3 rounded-lg border p-4"><div><Label htmlFor="district-ar">{lang === "ar" ? "الاسم بالعربية" : "Arabic name"}</Label><Input id="district-ar" maxLength={80} value={draft.name_ar} onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })} /></div><div><Label htmlFor="district-en">{lang === "ar" ? "الاسم بالإنجليزية" : "English name"}</Label><Input id="district-en" maxLength={80} value={draft.name_en} onChange={(e) => setDraft({ ...draft, name_en: e.target.value })} /></div><div className="flex items-center gap-3"><Switch checked={draft.is_active} onCheckedChange={(value) => setDraft({ ...draft, is_active: value })} /><Label>{lang === "ar" ? "متاحة للاختيار" : "Available to choose"}</Label></div><div className="flex gap-2"><Button disabled={save.isPending || draft.name_ar.trim().length < 2 || draft.name_en.trim().length < 2} onClick={() => save.mutate(draft)}>{lang === "ar" ? "حفظ" : "Save"}</Button><Button variant="outline" onClick={() => setDraft(null)}>{lang === "ar" ? "إلغاء" : "Cancel"}</Button></div></div> : null}</> : null}
  </section>;
}