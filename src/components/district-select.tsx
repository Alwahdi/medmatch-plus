import { useQuery } from "@tanstack/react-query";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLocations } from "@/lib/locations";

const YE = ["YE", "اليمن", "Yemen"];
const sameCountry = (a: string, b: string) => a === b || (YE.includes(a) && YE.includes(b));

/** Districts of the selected city only; hidden when the city has none. */
export function DistrictSelect({ country, city, value, onChange, lang }: {
  country: string; city: string; value: string; onChange: (id: string) => void; lang: "ar" | "en";
}) {
  const { data: rows = [] } = useLocations();
  const cityIds = rows.filter((r) => r.city_ar === city && sameCountry(r.country, country)).map((r) => r.id);
  const { data = [] } = useQuery({
    queryKey: ["districts", cityIds.join(",")],
    enabled: cityIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("districts").select("id,name_ar,name_en")
        .eq("is_active", true).in("city_location_id", cityIds).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!city || data.length === 0) return null;
  return (
    <div>
      <Label>{lang === "ar" ? "المديرية (اختياري)" : "District (optional)"}</Label>
      <Combobox
        options={data.map((d) => ({ value: d.id, label: lang === "ar" ? d.name_ar : d.name_en || d.name_ar }))}
        value={value}
        onChange={onChange}
        placeholder={lang === "ar" ? "اختر المديرية" : "Choose district"}
        searchPlaceholder={lang === "ar" ? "ابحث" : "Search"}
        emptyText={lang === "ar" ? "لا نتائج" : "No results"}
      />
    </div>
  );
}
