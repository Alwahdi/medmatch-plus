import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/shifts")({
  head: () => ({
    meta: [
      { title: "سوق المناوبات الطبية الفورية | SyndeoCare" },
      {
        name: "description",
        content:
          "احجز مناوبة طبية فورية بأجر بالساعة معلن في مستشفيات وعيادات المنطقة العربية — تمريض، طوارئ، صيدلة، أسنان وأشعة.",
      },
      { property: "og:title", content: "سوق المناوبات الطبية | SyndeoCare" },
      { property: "og:description", content: "مناوبات طبية متاحة للحجز الفوري بأجر بالساعة معلن." },
    ],
  }),
  component: ShiftsPage,
});

const ALL = "all";

function ShiftsPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [country, setCountry] = useState(ALL);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(
          "id,title,notes,starts_at,ends_at,hourly_rate,currency,country,city,status,is_urgent,facility_verified,applications_count,specialties(name_ar)",
        )
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data as unknown as ShiftRow[];
    },
  });

  const book = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from("shift_bookings")
        .insert({ shift_id: shiftId, user_id: user!.id });
      if (error) throw error;
      const { error: upErr } = await supabase
        .from("shifts")
        .update({ status: "booked", booked_by: user!.id })
        .eq("id", shiftId);
      if (upErr && upErr.code !== "42501") throw upErr;
    },
    onSuccess: () => {
      toast.success("تم حجز المناوبة — ستجدها في صفحة مناوباتي");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
    },
    onError: () => toast.error("تعذّر الحجز، ربما حُجزت المناوبة للتو"),
  });

  const countries = useMemo(() => Array.from(new Set((shifts ?? []).map((s) => s.country))), [shifts]);
  const filtered = (shifts ?? []).filter((s) => country === ALL || s.country === country);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">سوق المناوبات الفورية</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        مناوبات معلنة بأجر بالساعة واضح. اختر المناوبة المناسبة واحجزها مباشرة — بدون وسيط.
      </p>

      <div className="mt-6 max-w-xs">
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger><SelectValue placeholder="الدولة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الدول</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">لا توجد مناوبات متاحة حالياً.</p>
      ) : (
        <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              busy={book.isPending}
              onBook={() => {
                if (!user) {
                  navigate({ to: "/auth" });
                  return;
                }
                book.mutate(shift.id);
              }}
            />
          ))}
        </div>
      )}

      {!user && (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">سجّل دخولك لحجز المناوبات ومتابعة جدولك.</p>
          <Button className="mt-4" onClick={() => navigate({ to: "/auth" })}>تسجيل الدخول</Button>
        </div>
      )}
    </div>
  );
}
