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
import { ImageUpload } from "@/components/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { LockedField, ChangeRequestsPanel, useMyChangeRequests } from "@/components/change-request";

import { useSession } from "@/lib/auth";
import { countryLabel, specialtyName } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { cityOptions, countryOptions } from "@/lib/geo";
import { useLang } from "@/lib/i18n";

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

const TXT = {
  ar: {
    title: "ملفي المهني",
    sub: "كلما اكتمل ملفك ارتفعت دقة الترشيحات وفرصتك في القبول.",
    fullName: "الاسم الكامل",
    headline: "المسمى المهني",
    headlinePh: "مثال: استشاري طب طوارئ",
    specialty: "التخصص",
    specialtyPh: "اختر تخصصك",
    years: "سنوات الخبرة",
    country: "دولة الإقامة",
    countryPh: "اختر الدولة",
    city: "المدينة",
    licenseCountry: "دولة الترخيص",
    licenseNumber: "رقم الترخيص",
    bio: "نبذة مهنية",
    bioPh: "اكتب ملخصاً عن خبرتك، أبرز إنجازاتك، والمهارات السريرية التي تتقنها.",
    openTitle: "متاح للمناوبات الفورية",
    openText: "سنعرض مناوبات تناسب تخصصك ومدينتك.",
    save: "حفظ الملف",
    saving: "جارٍ الحفظ...",
    nameShort: "الاسم قصير جداً",
    saved: "تم حفظ ملفك المهني",
    saveFailed: "تعذّر الحفظ",
    editBtn: "تعديل الملف",
    previewBtn: "معاينة",
    asOthersSee: "هكذا يرى الآخرون ملفك",
    noBio: "لم تُضف نبذة مهنية بعد.",
    verified: "موثّق",
    yearsLabel: "سنوات خبرة",
    openBadge: "متاح للمناوبات",

  },
  en: {
    title: "My professional profile",
    sub: "The more complete your profile, the more accurate your recommendations and your chances of acceptance.",
    fullName: "Full name",
    headline: "Professional headline",
    headlinePh: "e.g. Emergency medicine consultant",
    specialty: "Specialty",
    specialtyPh: "Choose your specialty",
    years: "Years of experience",
    country: "Country of residence",
    countryPh: "Choose a country",
    city: "City",
    licenseCountry: "Country of license",
    licenseNumber: "License number",
    bio: "Professional bio",
    bioPh: "Write a summary of your experience, key achievements, and clinical skills.",
    openTitle: "Available for instant shifts",
    openText: "We'll show shifts that fit your specialty and city.",
    save: "Save profile",
    saving: "Saving...",
    nameShort: "Name is too short",
    saved: "Your profile has been saved",
    saveFailed: "Failed to save",
    editBtn: "Edit profile",
    previewBtn: "Preview",
    asOthersSee: "This is how others see your profile",
    noBio: "No professional bio yet.",
    verified: "Verified",
    yearsLabel: "years of experience",
    openBadge: "Open to shifts",

  },
} as const;

const schemaAr = z.object({
  full_name: z.string().trim().min(2, TXT.ar.nameShort).max(100),
  headline: z.string().trim().max(150).optional(),
  years_experience: z.number().int().min(0).max(60),
  bio: z.string().trim().max(1500).optional(),
  license_number: z.string().trim().max(60).optional(),
});

function ProfilePage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const { data: profile, isFetched: proFetched } = useQuery({
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

  const { data: account } = useQuery({
    queryKey: ["my-account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const locked = !!profile?.is_verified;
  const { data: requests } = useMyChangeRequests();
  const pendingOf = (field: string) =>
    (requests ?? []).find((r) => r.status === "pending" && r.field === field);

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
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const url = profile?.avatar_url ?? account?.avatar_url;
    if (url) setAvatar(url);
  }, [account, profile]);



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
      const parsed = schemaAr.safeParse({
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
        avatar_url: avatar || null,
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

      const { error: accErr } = await supabase
        .from("profiles")
        .update({ full_name: form.full_name.trim(), avatar_url: avatar || null })
        .eq("id", user!.id);
      if (accErr) throw accErr;
    },
    onSuccess: () => {
      toast.success(c.saved);
      queryClient.invalidateQueries({ queryKey: ["my-pro"] });
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
    },

    onError: (e: Error) => toast.error(e.message || c.saveFailed),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
        <p className="mt-1 text-muted-foreground">{c.sub}</p>
      </div>

      <div className="card-lift mt-6 rounded-2xl border border-border bg-card p-6">
        <ImageUpload
          value={avatar}
          onChange={setAvatar}
          fallback={(form.full_name.trim()[0] ?? "?").toUpperCase()}
          rounded="full"
          prefix="avatar"
        />
      </div>


      <div className="card-lift mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <LockedField label={c.fullName} locked={locked} target="professional" field="full_name"
            currentValue={form.full_name} pending={pendingOf("full_name")}>
            <Input id="name" value={form.full_name} maxLength={100} disabled={locked}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </LockedField>
          <div>
            <Label htmlFor="headline">{c.headline}</Label>
            <Input id="headline" placeholder={c.headlinePh} maxLength={150}
              value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </div>
          <LockedField label={c.specialty} locked={locked} target="professional" field="specialty_id"
            currentValue={specialtyName(specialties?.find((s) => s.id === form.specialty_id) ?? null, lang) ?? ""}
            pending={pendingOf("specialty_id")}>
            <Combobox
              options={(specialties ?? []).map((s) => ({
                value: s.id,
                label: specialtyName(s, lang) ?? "",
                keywords: [s.name_ar, s.name_en],
              }))}
              value={form.specialty_id}
              disabled={locked}
              onChange={(v) => setForm({ ...form, specialty_id: v })}
              placeholder={c.specialtyPh}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </LockedField>
          <LockedField label={c.years} locked={locked} target="professional" field="years_experience"
            currentValue={String(form.years_experience)} pending={pendingOf("years_experience")}>
            <Input id="years" type="number" min={0} max={60} value={form.years_experience} disabled={locked}
              onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })} />
          </LockedField>
          <LockedField label={c.country} locked={locked} target="professional" field="country"
            currentValue={form.country ? countryLabel(form.country, lang) : ""} pending={pendingOf("country")}>
            <Combobox
              options={countryOptions(lang)}
              value={form.country}
              disabled={locked}
              onChange={(v) => setForm({ ...form, country: v, city: "" })}
              placeholder={c.countryPh}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </LockedField>
          <LockedField label={c.city} locked={locked} target="professional" field="city"
            currentValue={form.city} pending={pendingOf("city")}>
            <Combobox
              options={cityOptions(form.country, lang)}
              value={form.city}
              disabled={locked}
              onChange={(v) => setForm({ ...form, city: v })}
              placeholder={ct.choose}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
              allowCustom
              customLabel={ct.add}
            />
          </LockedField>
          <LockedField label={c.licenseCountry} locked={locked} target="professional" field="license_country"
            currentValue={form.license_country ? countryLabel(form.license_country, lang) : ""}
            pending={pendingOf("license_country")}>
            <Combobox
              options={countryOptions(lang)}
              value={form.license_country}
              disabled={locked}
              onChange={(v) => setForm({ ...form, license_country: v })}
              placeholder={c.countryPh}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </LockedField>
          <LockedField label={c.licenseNumber} locked={locked} target="professional" field="license_number"
            currentValue={form.license_number} pending={pendingOf("license_number")}>
            <Input id="lic" dir="ltr" value={form.license_number} maxLength={60} disabled={locked}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
          </LockedField>
        </div>

        <div>
          <Label htmlFor="bio">{c.bio}</Label>
          <Textarea id="bio" rows={5} maxLength={1500} value={form.bio}
            placeholder={c.bioPh}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface p-4">
          <div>
            <p className="font-medium">{c.openTitle}</p>
            <p className="text-xs text-muted-foreground">{c.openText}</p>
          </div>
          <Switch checked={form.is_open_to_shifts}
            onCheckedChange={(v) => setForm({ ...form, is_open_to_shifts: v })} />
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? c.saving : c.save}
        </Button>
      </div>

      <ChangeRequestsPanel requests={(requests ?? []).filter((r) => r.target === "professional")} />
    </div>
  );
}
