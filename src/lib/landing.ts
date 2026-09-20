import { supabase } from "@/integrations/supabase/client";

export type LandingPath = "/admin" | "/facility" | "/dashboard" | "/onboarding";

/**
 * Resolves where a signed-in user should land after authentication:
 * admins -> /admin, facilities with a facility profile -> /facility,
 * professionals with a profile -> /dashboard, everyone else -> /onboarding.
 */
export async function resolveLanding(userId: string): Promise<LandingPath> {
  const [rolesRes, facRes, proRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("facilities").select("id").eq("user_id", userId).maybeSingle(),
    supabase.from("healthcare_professionals").select("id").eq("user_id", userId).maybeSingle(),
  ]);

  // فشل أي طلب هنا يعني توجيهاً خاطئاً صامتاً (مدير يُرسل إلى الإعداد) — نرمي بدل التخمين.
  if (rolesRes.error) throw rolesRes.error;
  if (facRes.error) throw facRes.error;
  if (proRes.error) throw proRes.error;

  const roles = (rolesRes.data ?? []).map((r) => r.role as string);
  if (roles.includes("admin")) return "/admin";
  if (facRes.data) return "/facility";
  if (proRes.data) return "/dashboard";
  return "/onboarding";
}
