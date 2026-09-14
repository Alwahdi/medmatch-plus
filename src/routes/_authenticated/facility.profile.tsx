import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountCard } from "@/components/account-card";
import { FacilityVerificationPanel } from "@/components/panels/facility.verification";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Building2, ExternalLink, Eye, Loader2, Pencil, ShieldAlert, Star } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/rating-stars";
import { ImageUpload } from "@/components/image-upload";
import { RemoteAvatar } from "@/components/remote-avatar";

import { supabase } from "@/integrations/supabase/client";
import { LockedField, ChangeRequestsPanel, useMyChangeRequests } from "@/components/change-request";
import { useSession } from "@/lib/auth";
import { countryLabel } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { cityOptions, countryOptions } from "@/lib/geo";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    title: "ملف المنشأة",
    sub: "هذه البيانات تظهر للكوادر الصحية بعد كشف هوية منشأتك.",
    noFacility: "لم تُنشئ ملف منشأة بعد.",
    createNow: "أنشئ ملف المنشأة",
    verified: "منشأة موثّقة",
    unverified: "بانتظار التوثيق من فريق SyndeoCare",
    verifyHint: "التوثيق يرفع ظهور وظائفك ويمنح المرشحين ثقة أكبر.",
    publicView: "معاينة الملف العام",
    rating: "تقييم الكوادر",
    noReviews: "لا تقييمات بعد",
    nameAr: "اسم المنشأة (عربي)",
    nameEn: "اسم المنشأة (إنجليزي)",
    type: "نوع المنشأة",
    hospital: "مستشفى",
    clinic: "عيادة",
    polyclinic: "مجمع طبي",
    pharmacy: "صيدلية",
    lab: "مختبر / أشعة",
    country: "الدولة",
    pickCountry: "اختر الدولة",
    city: "المدينة",
    website: "الموقع الإلكتروني",
    logo: "شعار المنشأة",
    description: "نبذة عن المنشأة",
    descHint: "اكتب نبذة واضحة عن تخصصات المنشأة وبيئة العمل — تزيد فرص التقديم عليك.",
    save: "حفظ التعديلات",
    saving: "جارٍ الحفظ...",
    saved: "تم تحديث ملف المنشأة",
    failed: "تعذّر الحفظ",
    nameRequired: "أدخل اسم المنشأة",
    cityRequired: "أدخل المدينة",
    editBtn: "تعديل الملف",
    previewBtn: "معاينة",
    asOthersSee: "هكذا يرى الآخرون ملف منشأتك",
    noAbout: "لم تُضف نبذة تعريفية بعد.",

  },
  en: {
    title: "Facility profile",
    sub: "These details are shown to professionals once your identity is revealed.",
    noFacility: "You haven't created a facility profile yet.",
    createNow: "Create facility profile",
    verified: "Verified facility",
    unverified: "Awaiting verification by the SyndeoCare team",
    verifyHint: "Verification boosts your listings and builds candidate trust.",
    publicView: "Preview public profile",
    rating: "Professional rating",
    noReviews: "No reviews yet",
    nameAr: "Facility name (Arabic)",
    nameEn: "Facility name (English)",
    type: "Facility type",
    hospital: "Hospital",
    clinic: "Clinic",
    polyclinic: "Medical complex",
    pharmacy: "Pharmacy",
    lab: "Lab / imaging",
    country: "Country",
    pickCountry: "Choose a country",
    city: "City",
    website: "Website",
    logo: "Facility logo",
    description: "About the facility",
    descHint: "Describe your specialties and work environment — it improves applications.",
    save: "Save changes",
    saving: "Saving...",
    saved: "Facility profile updated",
    failed: "Could not save",
    nameRequired: "Enter the facility name",
    cityRequired: "Enter the city",
    editBtn: "Edit profile",
    previewBtn: "Preview",
    asOthersSee: "This is how others see your facility profile",
    noAbout: "No description added yet.",

  },
} as const;

type FacilityProfileSearch = { tab?: string };

export const Route = createFileRoute("/_authenticated/facility/profile")({
  validateSearch: (search: Record<string, unknown>): FacilityProfileSearch =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
  head: () => ({
    meta: [
      { title: "ملف المنشأة | SyndeoCare" },
      { name: "description", content: "حدّث بيانات منشأتك وشعارها ونبذتها وحالة توثيقها." },
      { property: "og:title", content: "ملف المنشأة | SyndeoCare" },
      { property: "og:description", content: "إدارة بيانات المنشأة الصحية على SyndeoCare." },
    ],
  }),
  component: FacilityProfilePage,
});

function FacilityProfile() {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit">("view");

  const { data: facility, isLoading } = useQuery({
    queryKey: ["my-facility", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("facilities")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    facility_type: "hospital",
    country: "",
    city: "",
    website: "",
    logo_url: "",
    description: "",
  });

  useEffect(() => {
    if (!facility) return;
    setForm({
      name_ar: facility.name_ar ?? "",
      name_en: facility.name_en ?? "",
      facility_type: facility.facility_type ?? "hospital",
      country: facility.country ?? "",
      city: facility.city ?? "",
      website: facility.website ?? "",
      logo_url: facility.logo_url ?? "",
      description: facility.description ?? "",
    });
  }, [facility]);

  const locked = !!facility?.is_verified;
  const { data: requests } = useMyChangeRequests();
  const pendingOf = (field: string) =>
    (requests ?? []).find((r) => r.status === "pending" && r.field === field);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = z
        .object({
          name_ar: z.string().trim().min(2, c.nameRequired).max(120),
          city: z.string().trim().min(2, c.cityRequired).max(60),
        })
        .safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase
        .from("facilities")
        .update({
          name_ar: form.name_ar.trim(),
          name_en: form.name_en.trim() || null,
          facility_type: form.facility_type,
          country: form.country,
          city: form.city.trim(),
          website: form.website.trim() || null,
          logo_url: form.logo_url.trim() || null,
          description: form.description.trim() || null,
        })
        .eq("id", facility!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.saved);
      queryClient.invalidateQueries({ queryKey: ["my-facility"] });
      queryClient.invalidateQueries({ queryKey: ["my-facility-lite"] });
      setMode("view");
    },
    onError: (e: Error) => toast.error(e.message || c.failed),
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );

  if (!facility)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-surface text-muted-foreground">
          <Building2 className="size-7" />
        </span>
        <p className="mt-5 text-muted-foreground">{c.noFacility}</p>
        <Button className="mt-5" asChild>
          <Link to="/facility">{c.createNow}</Link>
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-7" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "view" ? (
            <Button onClick={() => setMode("edit")}>
              <Pencil className="size-4" /> {c.editBtn}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setMode("view")}>
              <Eye className="size-4" /> {c.previewBtn}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/facilities/$facilityId" params={{ facilityId: facility.id }}>
              <ExternalLink className="size-4" /> {c.publicView}
            </Link>
          </Button>
        </div>
      </div>


      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          {facility.is_verified ? (
            <BadgeCheck className="size-6 text-primary" />
          ) : (
            <ShieldAlert className="size-6 text-warning" />
          )}
          <div>
            <p className="text-sm font-bold">
              {facility.is_verified ? c.verified : c.unverified}
            </p>
            {!facility.is_verified && (
              <p className="text-xs text-muted-foreground">{c.verifyHint}</p>
            )}
            <Button asChild size="sm" variant="link" className="h-auto p-0 text-xs">
              <Link to="/facility/profile" search={{ tab: "verification" }}>
                {lang === "ar" ? "إدارة مستندات التوثيق" : "Manage verification documents"}
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          <Star className="size-6 text-amber-400" />
          <div>
            <p className="text-sm font-bold">{c.rating}</p>
            {facility.rating_count > 0 ? (
              <RatingStars value={Number(facility.rating_avg)} count={facility.rating_count} />
            ) : (
              <p className="text-xs text-muted-foreground">{c.noReviews}</p>
            )}
          </div>
        </div>
      </div>

      {mode === "view" && (
        <div className="card-lift mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground">{c.asOthersSee}</p>
          <div className="mt-4 flex items-start gap-4">
            <RemoteAvatar
              value={facility.logo_url}
              alt={facility.name_ar ?? ""}
              fallbackText={facility.name_ar ?? "?"}
              className="size-16 shrink-0 rounded-2xl text-lg"
            />
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-xl font-extrabold">
                <span className="truncate">{facility.name_ar}</span>
                {facility.is_verified && <BadgeCheck className="size-5 shrink-0 text-primary" />}
              </h2>
              {facility.name_en && (
                <p dir="ltr" className="truncate text-sm text-muted-foreground">{facility.name_en}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                {[
                  c[facility.facility_type as "hospital"] ?? facility.facility_type,
                  facility.city,
                  facility.country ? countryLabel(facility.country, lang) : "",
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              {facility.rating_count > 0 && (
                <div className="mt-2">
                  <RatingStars value={Number(facility.rating_avg)} count={facility.rating_count} />
                </div>
              )}
              {facility.website && (
                <a
                  href={facility.website}
                  target="_blank"
                  rel="noreferrer"
                  dir="ltr"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="size-4" /> {facility.website}
                </a>
              )}
            </div>
          </div>
          <p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {facility.description || c.noAbout}
          </p>
        </div>
      )}

      {mode === "edit" && (
      <div className="card-lift mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">

        <div className="grid gap-4 sm:grid-cols-2">
          <LockedField label={c.nameAr} locked={locked} target="facility" field="name_ar"
            currentValue={form.name_ar} facilityId={facility.id} pending={pendingOf("name_ar")}>
            <Input
              id="name_ar"
              maxLength={120}
              disabled={locked}
              value={form.name_ar}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            />
          </LockedField>
          <LockedField label={c.nameEn} locked={locked} target="facility" field="name_en"
            currentValue={form.name_en} facilityId={facility.id} pending={pendingOf("name_en")}>
            <Input
              id="name_en"
              dir="ltr"
              maxLength={120}
              disabled={locked}
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            />
          </LockedField>
          <LockedField label={c.type} locked={locked} target="facility" field="facility_type"
            currentValue={form.facility_type} facilityId={facility.id} pending={pendingOf("facility_type")}>
            <Select
              value={form.facility_type}
              disabled={locked}
              onValueChange={(v) => setForm({ ...form, facility_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hospital">{c.hospital}</SelectItem>
                <SelectItem value="clinic">{c.clinic}</SelectItem>
                <SelectItem value="polyclinic">{c.polyclinic}</SelectItem>
                <SelectItem value="pharmacy">{c.pharmacy}</SelectItem>
                <SelectItem value="lab">{c.lab}</SelectItem>
              </SelectContent>
            </Select>
          </LockedField>
          <LockedField label={c.country} locked={locked} target="facility" field="country"
            currentValue={form.country ? countryLabel(form.country, lang) : ""} facilityId={facility.id}
            pending={pendingOf("country")}>
            <Combobox
              options={countryOptions(lang)}
              value={form.country}
              disabled={locked}
              onChange={(v) => setForm({ ...form, country: v, city: "" })}
              placeholder={c.pickCountry}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </LockedField>
          <LockedField label={c.city} locked={locked} target="facility" field="city"
            currentValue={form.city} facilityId={facility.id} pending={pendingOf("city")}>
            <Combobox
              options={cityOptions(form.country, lang)}
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
          <div>
            <Label htmlFor="website">{c.website}</Label>
            <Input
              id="website"
              dir="ltr"
              maxLength={200}
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>{c.logo}</Label>
            <div className="mt-2">
              <ImageUpload
                value={form.logo_url}
                onChange={(v) => setForm({ ...form, logo_url: v })}
                fallback={(form.name_ar.trim()[0] ?? "?").toUpperCase()}
                prefix="logo"
              />
            </div>
          </div>

        </div>

        <div>
          <Label htmlFor="desc">{c.description}</Label>
          <Textarea
            id="desc"
            rows={5}
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">{c.descHint}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {save.isPending ? c.saving : c.save}
          </Button>
          <Button variant="outline" onClick={() => setMode("view")}>
            <Eye className="size-4" /> {c.previewBtn}
          </Button>
        </div>
      </div>
      )}

      <ChangeRequestsPanel requests={(requests ?? []).filter((r) => r.target === "facility")} />

    </div>
  );
}

const PTABS = {
  ar: { profile: "الملف", verification: "التوثيق", plan: "الباقة" },
  en: { profile: "Profile", verification: "Verification", plan: "Plan" },
} as const;

function FacilityProfilePage() {
  const { lang } = useLang();
  const tt = PTABS[lang];
  const tab = Route.useSearch().tab ?? "profile";
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Tabs
        value={tab}
        onValueChange={(v) =>
          void navigate({ to: "/facility/profile", search: { tab: v }, replace: true })
        }
      >
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="profile" className="shrink-0">{tt.profile}</TabsTrigger>
            <TabsTrigger value="verification" className="shrink-0">{tt.verification}</TabsTrigger>
            <TabsTrigger value="plan" className="shrink-0">{tt.plan}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="mt-2">
          <FacilityProfile />
        </TabsContent>
        <TabsContent value="verification" className="mt-2">
          <FacilityVerificationPanel />
        </TabsContent>
        <TabsContent value="plan" className="mt-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-extrabold">
              {lang === "ar" ? "باقة الاشتراك" : "Subscription plan"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "ar"
                ? "اطّلع على حدود باقتك الحالية وقارن بين الباقات المتاحة."
                : "Review your current plan limits and compare available plans."}
            </p>
            <Button className="mt-4" asChild>
              <Link to="/pricing">{lang === "ar" ? "عرض الباقات" : "View plans"}</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <AccountCard showAlerts={false} />
    </div>
  );
}
