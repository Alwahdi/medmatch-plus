import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { COUNTRIES } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "ملفي المهني | SyndeoCare" },
      { name: "description", content: "حدّث تخصصك وخبرتك وترخيصك لتحصل على ترشيحات وظيفية أدق." },
      { property: "og:title", content: "ملفي المهني | SyndeoCare" },
      { property: "og:description", content: "بيانات الكادر الصحي المهنية على SyndeoCare." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير جداً").max(100),
  headline: z.string().trim().max(150).optional(),
  years_experience: z.number().int().min(0).max(60),
  bio: z.string().trim().max(1500).optional(),
  license_number: z.string().trim().max(60).optional(),
});

function ProfilePage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar").order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-pro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("healthcare_professionals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    specialty_id: "",
    years_experience: 0,
    country: "",
    city: "",
    bio: "",
    license_country: "",
    license_number: "",
    is_open_to_shifts: true,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      headline: profile.headline ?? "",
      specialty_id: profile.specialty_id ?? "",
      years_experience: profile.years_experience ?? 0,
      country: profile.country ?? "",
      city: profile.city ?? "",
      bio: profile.bio ?? "",
      license_country: profile.license_country ?? "",
      license_number: profile.license_number ?? "",
      is_open_to_shifts: profile.is_open_to_shifts ?? true,
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        full_name: form.full_name,
        headline: form.headline,
        years_experience: Number(form.years_experience),
        bio: form.bio,
        license_number: form.license_number,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);

      const payload = {
        user_id: user!.id,
        full_name: form.full_name.trim(),
        headline: form.headline.trim() || null,
        specialty_id: form.specialty_id || null,
        years_experience: Number(form.years_experience),
        country: form.country || null,
        city: form.city.trim() || null,
        bio: form.bio.trim() || null,
        license_country: form.license_country || null,
        license_number: form.license_number.trim() || null,
        is_open_to_shifts: form.is_open_to_shifts,
      };

      if (profile) {
        const { error } = await supabase
          .from("healthcare_professionals")
          .update(payload)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("healthcare_professionals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ ملفك المهني");
      queryClient.invalidateQueries({ queryKey: ["my-pro"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذّر الحفظ"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">ملفي المهني</h1>
      <p className="mt-2 text-muted-foreground">
        كلما اكتمل ملفك ارتفعت دقة الترشيحات وفرصتك في القبول.
      </p>

      <div className="card-lift mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input id="name" value={form.full_name} maxLength={100}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="headline">المسمى المهني</Label>
            <Input id="headline" placeholder="مثال: استشاري طب طوارئ" maxLength={150}
              value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </div>
          <div>
            <Label>التخصص</Label>
            <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر تخصصك" /></SelectTrigger>
              <SelectContent>
                {specialties?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="years">سنوات الخبرة</Label>
            <Input id="years" type="number" min={0} max={60} value={form.years_experience}
              onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })} />
          </div>
          <div>
            <Label>دولة الإقامة</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder="اختر الدولة" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="city">المدينة</Label>
            <Input id="city" value={form.city} maxLength={60}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>دولة الترخيص</Label>
            <Select value={form.license_country} onValueChange={(v) => setForm({ ...form, license_country: v })}>
              <SelectTrigger><SelectValue placeholder="اختر الدولة" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="lic">رقم الترخيص</Label>
            <Input id="lic" dir="ltr" value={form.license_number} maxLength={60}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">نبذة مهنية</Label>
          <Textarea id="bio" rows={5} maxLength={1500} value={form.bio}
            placeholder="اكتب ملخصاً عن خبرتك، أبرز إنجازاتك، والمهارات السريرية التي تتقنها."
            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface p-4">
          <div>
            <p className="font-medium">متاح للمناوبات الفورية</p>
            <p className="text-xs text-muted-foreground">سنعرض مناوبات تناسب تخصصك ومدينتك.</p>
          </div>
          <Switch checked={form.is_open_to_shifts}
            onCheckedChange={(v) => setForm({ ...form, is_open_to_shifts: v })} />
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "جارٍ الحفظ..." : "حفظ الملف"}
        </Button>
      </div>
    </div>
  );
}
