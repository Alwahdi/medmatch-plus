import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export type Scope = "mine" | "field" | "all";

export type SpecialtyRow = {
  id: string;
  name_ar: string;
  name_en: string;
  category: string;
};

/**
 * Returns the signed-in professional's specialty, plus every specialty id that
 * belongs to the same category (their "field"), so listings can be narrowed to
 * what actually matches the user.
 */
export function useSpecialtyScope() {
  const { user } = useSession();

  const { data: specialties } = useQuery({
    queryKey: ["specialties-with-category"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specialties")
        .select("id,name_ar,name_en,category")
        .order("name_ar");
      if (error) throw error;
      return data as SpecialtyRow[];
    },
  });

  const { data: pro } = useQuery({
    queryKey: ["my-pro-specialty", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("healthcare_professionals")
        .select("specialty_id,years_experience,country,license_country")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const mine = pro?.specialty_id ?? null;
  const mySpecialty = specialties?.find((s) => s.id === mine) ?? null;
  const fieldIds = mySpecialty
    ? (specialties ?? []).filter((s) => s.category === mySpecialty.category).map((s) => s.id)
    : [];

  return {
    specialties: specialties ?? [],
    pro: pro ?? null,
    mySpecialtyId: mine,
    mySpecialty,
    fieldIds,
    hasSpecialty: !!mine,
  };
}

export function inScope(
  scope: Scope,
  specialtyId: string | null,
  mySpecialtyId: string | null,
  fieldIds: string[],
): boolean {
  if (scope === "all" || !mySpecialtyId) return true;
  if (!specialtyId) return false;
  if (scope === "mine") return specialtyId === mySpecialtyId;
  return fieldIds.includes(specialtyId);
}
