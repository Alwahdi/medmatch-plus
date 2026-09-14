import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "facility" | "professional";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useRoles(user: User | null) {
  return useQuery({
    queryKey: ["roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

/** الملف الخاص بالمنشأة التي يملكها المستخدم الحالي (إن وُجد). */
export function useMyFacility(user: User | null) {
  return useQuery({
    queryKey: ["my-facility-lite", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("facilities")
        .select("id,name_ar,name_en,logo_url,is_verified")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });
}

/** الصفحة الرئيسية المناسبة لدور المستخدم. */
export function roleHome(roles: AppRole[] | undefined) {
  if (!roles) return "/dashboard";
  if (roles.includes("facility")) return "/facility";
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("professional")) return "/dashboard";
  // حساب جديد بلا نوع (مثلاً دخول جوجل) — يكمل الإعداد أولاً.
  return "/onboarding";
}
