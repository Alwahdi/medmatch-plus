import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CvPanel } from "@/components/panels/cv";
import { CvImportPanel } from "@/components/panels/cv-import";
import { CredentialsPanel } from "@/components/panels/credentials";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BadgeCheck, Eye, Pencil } from "lucide-react";
import { RemoteAvatar } from "@/components/remote-avatar";
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
import { LocationPicker } from "@/components/location-picker";
import { AvailabilityPicker, availabilityLabel, parseAvailability } from "@/components/availability-picker";
import { supabase } from "@/integrations/supabase/client";
import { assertOk } from "@/lib/query-errors";
import { LockedField, ChangeRequestsPanel, useMyChangeRequests } from "@/components/change-request";

import { useSession } from "@/lib/auth";
import { countryLabel, specialtyName } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { countryOptions } from "@/lib/geo";
import { cityOptionsFrom, useLocations } from "@/lib/locations";
import { useLang } from "@/lib/i18n";
import { friendlyError, userError } from "@/lib/user-errors";
import { WorkspaceHeading } from "@/components/workspace-ui";
import { ErrorState } from "@/components/error-state";

type ProfileSearch = { tab?: string };

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
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
    searchableTitle: "إظهار ملفي للمنشآت في بحث المرشحين",
    searchableText:
      "عند تفعيله ترى المنشآت المؤهلة تخصصك وسنوات خبرتك ومدينتك ودولتك وحالة التوثيق وإتاحتك للمناوبات، ولا ترى رقم هاتفك أو بريدك أو مستنداتك. يمكنك إيقافه في أي وقت.",
    searchableOffNote: "عند الإيقاف لن تظهر في عمليات البحث الجديدة، ولن تستطيع المنشآت إرسال دعوات أو رسائل جديدة نتيجة بحث سابق. طلباتك ومحادثاتك الحالية تبقى كما هي ولا يُحذف منها شيء.",
    visibilityOn: "ظاهر في بحث المنشآت",
    visibilityOff: "مخفي عن البحث",
    visibilitySaved: "تم تحديث ظهورك في البحث",
    visibilityFailed: "تعذّر تحديث الظهور",
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
    rate: "الأجر المرغوب",
    ratePh: "مثال: 5000",
    rateHint: "أجرك المتوقع بالريال اليمني. تراه المنشآت كمرجع، والاتفاق على الدفع يتم مباشرة معها.",
    ratePeriod: "وحدة الأجر",
    perHour: "بالساعة",
    perDay: "باليوم",
    radius: "نطاق القبول (كم)",
    radiusPh: "مثال: 25",
    radiusHint: "أقصى مسافة مستعد للتنقل إليها للعمل.",

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
    searchableTitle: "Show my profile to facilities in candidate search",
    searchableText:
      "When on, eligible facilities can see your specialty, years of experience, city, country, verification status and shift availability — not your phone, email or documents. You can turn it off at any time.",
    searchableOffNote: "When off you stay out of new searches, and facilities can no longer send new invitations or messages based on an earlier search. Your existing applications and conversations stay exactly as they are.",
    visibilityOn: "Visible in facility search",
    visibilityOff: "Hidden from search",
    visibilitySaved: "Search visibility updated",
    visibilityFailed: "Could not update visibility",
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
    rate: "Preferred rate",
    ratePh: "e.g. 5000",
    rateHint: "Your expected rate in YER. Facilities see it as a guide — payment is agreed directly with the facility.",
    ratePeriod: "Rate period",
    perHour: "Per hour",
    perDay: "Per day",
    radius: "Acceptance radius (km)",
    radiusPh: "e.g. 25",
    radiusHint: "The maximum distance you're willing to travel for work.",

  },
} as const;

const schemaAr = z.object({
  full_name: z.string().trim().min(2, TXT.ar.nameShort).max(100),
  headline: z.string().trim().max(150).optional(),
  years_experience: z.number().int().min(0).max(60),
  bio: z.string().trim().max(1500).optional(),
  license_number: z.string().trim().max(60).optional(),
});

function ProfileOverview() {
  const { lang } = useLang();
  const { data: locationRows } = useLocations();
  const c = TXT[lang];
  const ct = comboText(lang);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");

  const { data: specialties, isError: specialtiesErr, refetch: specialtiesRefetch } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const { data: profile, isError: profileErr, refetch: profileRefetch, isFetched: proFetched } = useQuery({
    queryKey: ["my-pro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("healthcare_professionals")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: account, isError: accountErr, refetch: accountRefetch } = useQuery({
    queryKey: ["my-account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
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
    lat: null as number | null,
    lng: null as number | null,
    availability: [] as number[],
    search_radius_km: "",
    preferred_rate: "",
    preferred_rate_period: "hour",
  });
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    const url = profile?.avatar_url ?? account?.avatar_url;
    if (url) setAvatar(url);
  }, [account, profile]);

  useEffect(() => {
    if (proFetched && !profile) setMode("edit");
  }, [proFetched, profile]);





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
      lat: profile.lat === null || profile.lat === undefined ? null : Number(profile.lat),
      lng: profile.lng === null || profile.lng === undefined ? null : Number(profile.lng),
      availability: parseAvailability(profile.availability),
      search_radius_km: profile.search_radius_km === null || profile.search_radius_km === undefined ? "" : String(profile.search_radius_km),
      preferred_rate: profile.preferred_rate === null || profile.preferred_rate === undefined ? "" : String(profile.preferred_rate),
      preferred_rate_period: profile.preferred_rate_period ?? "hour",
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
      if (!parsed.success) userError(parsed.error.issues[0]!.message);

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
        lat: form.lat,
        lng: form.lng,
        availability: form.availability,
        search_radius_km: form.search_radius_km === "" ? null : Math.max(1, Math.min(500, Number(form.search_radius_km))),
        preferred_rate: form.preferred_rate === "" ? null : Math.max(0, Number(form.preferred_rate)),
        preferred_rate_period: form.preferred_rate_period,
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
        // أول إنشاء للملف = تفعيل دور الكادر حتى لا يعود إلى شاشة الإعداد.
        assertOk(await supabase.rpc("claim_professional_role"));
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
      queryClient.invalidateQueries({ queryKey: ["roles", user?.id] });
      setMode("view");
    },

    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  // Search visibility is opt-in and goes through its own trusted action, so a
  // routine profile save can never turn it on.
  const searchable = profile?.is_searchable === true;
  const setVisibility = useMutation({
    mutationFn: async (visible: boolean) => {
      assertOk(await supabase.rpc("set_search_visibility", { _visible: visible }));
    },
    onSuccess: () => {
      toast.success(c.visibilitySaved);
      queryClient.invalidateQueries({ queryKey: ["my-pro"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.visibilityFailed)),
  });



  const loadErrors = [
    { err: specialtiesErr, retry: specialtiesRefetch },
    { err: profileErr, retry: profileRefetch },
    { err: accountErr, retry: accountRefetch },
  ].filter((q) => q.err);
  if (loadErrors.length > 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState
          onRetry={() => {
            for (const q of loadErrors) void q.retry();
          }}
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex justify-end">
        {mode === "view" ? (
          <Button onClick={() => setMode("edit")}>
            <Pencil className="size-4" /> {c.editBtn}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setMode("view")}>
            <Eye className="size-4" /> {c.previewBtn}
          </Button>
        )}
      </div>

      {mode === "view" && (
        <div className="card-lift mt-6 rounded-lg border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground">{c.asOthersSee}</p>
          <div className="mt-4 flex items-start gap-4">
            <RemoteAvatar
              value={avatar || null}
              alt={form.full_name}
              fallbackText={form.full_name || "?"}
              className="size-16 shrink-0 rounded-full text-lg"
              verified={!!profile?.is_verified}
            />
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-xl font-extrabold">
                <span className="truncate">{form.full_name || (lang === "ar" ? "ملفي" : "My profile")}</span>
                {profile?.is_verified && <BadgeCheck className="size-5 shrink-0 text-primary" />}
              </h2>
              {form.headline && (
                <p className="truncate text-sm text-muted-foreground">{form.headline}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                {[
                  specialtyName(specialties?.find((s) => s.id === form.specialty_id) ?? null, lang) ?? "",
                  form.city,
                  form.country ? countryLabel(form.country, lang) : "",
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                 <span className="rounded-md bg-surface px-3 py-1 text-muted-foreground">
                  {form.years_experience} {c.yearsLabel}
                </span>
                {profile?.is_verified && (
                   <span className="rounded-md bg-primary/10 px-3 py-1 font-medium text-primary">
                    {c.verified}
                  </span>
                )}
                {form.is_open_to_shifts && (
                   <span className="rounded-md bg-success/10 px-3 py-1 font-medium text-success">
                    {c.openBadge}
                  </span>
                )}
                <span className="rounded-md bg-surface px-3 py-1 text-muted-foreground">
                  {searchable ? c.visibilityOn : c.visibilityOff}
                </span>
                {form.availability.length > 0 && (
                  <span className="rounded-md bg-surface px-3 py-1 text-muted-foreground">
                    {availabilityLabel(form.availability, lang)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {form.bio || c.noBio}
          </p>
        </div>
      )}

      {mode === "edit" && (
      <div className="card-lift mt-6 rounded-lg border border-border bg-card p-6">
        <ImageUpload
          value={avatar}
          onChange={setAvatar}
          fallback={(form.full_name.trim()[0] ?? "?").toUpperCase()}
          rounded="full"
          prefix="avatar"
        />
      </div>
      )}



      {mode === "edit" && (
      <div className="card-lift mt-6 space-y-5 rounded-lg border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <LockedField inputId="name" label={c.fullName} locked={locked} target="professional" field="full_name"
            currentStoredValue={form.full_name} editor={{ kind: "text", maxLength: 100 }}
            pending={pendingOf("full_name")}>
            <Input id="name" value={form.full_name} maxLength={100} disabled={locked}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </LockedField>
          <div>
            <Label htmlFor="headline">{c.headline}</Label>
            <Input id="headline" placeholder={c.headlinePh} maxLength={150}
              value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </div>
          <LockedField label={c.specialty} locked={locked} target="professional" field="specialty_id"
            currentStoredValue={form.specialty_id}
            currentDisplayValue={specialtyName(specialties?.find((s) => s.id === form.specialty_id) ?? null, lang) ?? ""}
            editor={{ kind: "specialty" }}
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
          <LockedField inputId="years" label={c.years} locked={locked} target="professional" field="years_experience"
            currentStoredValue={String(form.years_experience)} editor={{ kind: "number", min: 0, max: 60 }}
            pending={pendingOf("years_experience")}>
            <Input id="years" type="number" min={0} max={60} value={form.years_experience} disabled={locked}
              onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })} />
          </LockedField>
          <LockedField label={c.country} locked={locked} target="professional" field="country"
            currentStoredValue={form.country}
            currentDisplayValue={form.country ? countryLabel(form.country, lang) : ""}
            editor={{ kind: "country" }} pending={pendingOf("country")}>
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
            currentStoredValue={form.city} editor={{ kind: "city", country: form.country }}
            pending={pendingOf("city")}>
            <Combobox
              options={cityOptionsFrom(locationRows, form.country, lang)}
              value={form.city}
              disabled={locked || !form.country}
              onChange={(v) => setForm({ ...form, city: v })}
              placeholder={form.country ? ct.choose : ct.pickCountryFirst}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
              allowCustom
              customLabel={ct.add}
            />
          </LockedField>
          <LockedField label={c.licenseCountry} locked={locked} target="professional" field="license_country"
            currentStoredValue={form.license_country}
            currentDisplayValue={form.license_country ? countryLabel(form.license_country, lang) : ""}
            editor={{ kind: "country" }}
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
          <LockedField inputId="lic" label={c.licenseNumber} locked={locked} target="professional" field="license_number"
            currentStoredValue={form.license_number} editor={{ kind: "text", maxLength: 60, dir: "ltr" }}
            pending={pendingOf("license_number")}>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="rate">{c.rate}</Label>
            <Input id="rate" type="number" min={0} inputMode="decimal" placeholder={c.ratePh}
              value={form.preferred_rate}
              onChange={(e) => setForm({ ...form, preferred_rate: e.target.value })} />
            <p className="mt-1 text-xs text-muted-foreground">{c.rateHint}</p>
          </div>
          <div>
            <Label htmlFor="rate-period">{c.ratePeriod}</Label>
            <Select value={form.preferred_rate_period}
              onValueChange={(v) => setForm({ ...form, preferred_rate_period: v })}>
              <SelectTrigger id="rate-period"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">{c.perHour}</SelectItem>
                <SelectItem value="day">{c.perDay}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AvailabilityPicker value={form.availability}
          onChange={(v) => setForm({ ...form, availability: v })} />

        <LocationPicker value={{ lat: form.lat, lng: form.lng }}
          onChange={(v) => setForm({ ...form, lat: v.lat, lng: v.lng })} />

        <div>
          <Label htmlFor="radius">{c.radius}</Label>
          <Input id="radius" type="number" min={1} max={500} inputMode="numeric" placeholder={c.radiusPh}
            value={form.search_radius_km}
            onChange={(e) => setForm({ ...form, search_radius_km: e.target.value })} />
          <p className="mt-1 text-xs text-muted-foreground">{c.radiusHint}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-surface p-4">
          <div>
            <p className="font-medium">{c.openTitle}</p>
            <p className="text-xs text-muted-foreground">{c.openText}</p>
          </div>
          <Switch checked={form.is_open_to_shifts}
            onCheckedChange={(v) => setForm({ ...form, is_open_to_shifts: v })} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-surface p-4">
          <div>
            <p className="font-medium">{c.searchableTitle}</p>
            <p className="text-xs text-muted-foreground">{c.searchableText}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.searchableOffNote}</p>
          </div>
          <Switch
            checked={searchable}
            disabled={!profile || setVisibility.isPending}
            aria-label={c.searchableTitle}
            onCheckedChange={(v) => setVisibility.mutate(v)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate()} loading={save.isPending}>
            {save.isPending ? c.saving : c.save}
          </Button>
          {profile && (
            <Button variant="outline" onClick={() => setMode("view")}>
              <Eye className="size-4" /> {c.previewBtn}
            </Button>
          )}
        </div>
      </div>
      )}

      <ChangeRequestsPanel requests={(requests ?? []).filter((r) => r.target === "professional")} />
    </div>
  );
}

const TABS = {
  ar: {
    overview: "البيانات",
    cv: "سيرتي الذاتية",
    cvImport: "استيراد سيرة",
    credentials: "الوثائق والتراخيص",
    title: "ملفي المهني",
    sub: "كلما اكتمل ملفك ارتفعت دقة الترشيحات وفرصتك في القبول.",
  },
  en: {
    overview: "Details",
    cv: "My CV",
    cvImport: "Import CV",
    credentials: "Documents",
    title: "My professional profile",
    sub: "The more complete your profile, the more accurate your recommendations and your chances of acceptance.",
  },
} as const;

function ProfilePage() {
  const { lang } = useLang();
  const tt = TABS[lang];
  const tab = Route.useSearch().tab ?? "overview";
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <WorkspaceHeading title={tt.title} description={tt.sub} />
      <Tabs
        className="mt-6"
        value={tab}
        onValueChange={(v) => void navigate({ to: "/profile", search: { tab: v }, replace: true })}
      >
        <div className="-mx-4 overflow-x-auto border-x border-transparent px-4 pb-2 [scrollbar-width:thin]">
          <TabsList className="w-max">
            <TabsTrigger value="overview" className="shrink-0">{tt.overview}</TabsTrigger>
            <TabsTrigger value="cv" className="shrink-0">{tt.cv}</TabsTrigger>
            <TabsTrigger value="cv-import" className="shrink-0">{tt.cvImport}</TabsTrigger>
            <TabsTrigger value="credentials" className="shrink-0">{tt.credentials}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <ProfileOverview />
        </TabsContent>
        <TabsContent value="cv" className="mt-6">
          <CvPanel />
        </TabsContent>
        <TabsContent value="cv-import" className="mt-6">
          <CvImportPanel />
        </TabsContent>
        <TabsContent value="credentials" className="mt-6">
          <CredentialsPanel />
        </TabsContent>
      </Tabs>

    </div>
  );
}
