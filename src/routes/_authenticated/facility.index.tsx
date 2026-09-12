import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import {
  COUNTRIES,
  EMPLOYMENT_LABELS,
  formatDateTime,
  formatMoney,
  formatSalary,
} from "@/lib/format";

export const Route = createFileRoute("/_authenticated/facility/")({
  head: () => ({
    meta: [
      { title: "لوحة المنشأة | SyndeoCare" },
      { name: "description", content: "أدر ملف منشأتك وانشر الوظائف والمناوبات وتابع المتقدمين." },
      { property: "og:title", content: "لوحة المنشأة | SyndeoCare" },
      { property: "og:description", content: "إدارة الوظائف والمناوبات للمنشآت الصحية." },
    ],
  }),
  component: FacilityDashboard,
});

type PlanRow = {
  code: string;
  name_ar: string;
  active_jobs: number;
  active_shifts: number;
  candidate_searches: number;
  ai_credits: number;
  is_trial: boolean;
};
type SubRow = {
  status: string;
  ends_at: string | null;
  plan_code: string;
  subscription_plans: PlanRow | null;
};

function FacilityDashboard() {
  const { user } = useSession();
  const queryClient = useQueryClient();

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

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,name_ar").order("name_ar");
      return data ?? [];
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["facility-jobs", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*,applications(id)")
        .eq("facility_id", facility!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ["facility-shifts", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data } = await supabase
        .from("shifts")
        .select("*")
        .eq("facility_id", facility!.id)
        .order("starts_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: sub } = useQuery({
    queryKey: ["facility-sub", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data } = await supabase
        .from("facility_subscriptions")
        .select("*,subscription_plans(*)")
        .eq("facility_id", facility!.id)
        .maybeSingle();
      return data as unknown as SubRow | null;
    },
  });

  const plan = sub?.subscription_plans ?? null;
  const subActive =
    !!sub &&
    (sub.status === "active" || sub.status === "trialing") &&
    (!sub.ends_at || new Date(sub.ends_at) > new Date());
  const activeJobs = (jobs ?? []).filter((j) => j.is_active).length;
  const activeShifts = (shifts ?? []).filter((s) => s.status === "open").length;

  const toggleJob = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("jobs").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["facility-jobs"] }),
  });

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">جارٍ التحميل...</p>;
  if (!facility) return <FacilityForm />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{facility.name_ar}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {facility.city}، {facility.country}
            {facility.is_verified ? " · منشأة موثّقة" : " · بانتظار التوثيق"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/facility/applicants">المتقدمون</Link>
        </Button>
      </div>

      {plan && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
          <div>
            <p className="flex items-center gap-2 font-bold">
              باقة {plan.name_ar}
              {plan.is_trial && <Badge variant="secondary">تجربة مجانية</Badge>}
              {!subActive && <Badge variant="destructive">منتهية</Badge>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {sub?.ends_at
                ? `تنتهي في ${formatDateTime(sub.ends_at)}`
                : "اشتراك ساري"}{" "}
              · الوظائف النشطة {activeJobs}/{plan.active_jobs} · المناوبات المتاحة {activeShifts}/
              {plan.active_shifts}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/pricing">ترقية الباقة</Link>
          </Button>
        </div>
      )}

      <Tabs defaultValue="jobs" className="mt-8">
        <TabsList>
          <TabsTrigger value="jobs">الوظائف ({jobs?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="shifts">المناوبات ({shifts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="new-job">نشر وظيفة</TabsTrigger>
          <TabsTrigger value="new-shift">نشر مناوبة</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6 space-y-3">
          {jobs?.length ? (
            jobs.map((j) => (
              <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="font-bold">{j.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSalary(Number(j.salary_min), Number(j.salary_max), j.currency)} ·{" "}
                    {EMPLOYMENT_LABELS[j.employment_type]} · {j.applications?.length ?? 0} متقدم
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={j.is_active ? "default" : "secondary"}>
                    {j.is_active ? "منشورة" : "مغلقة"}
                  </Badge>
                  <Button size="sm" variant="ghost"
                    onClick={() => toggleJob.mutate({ id: j.id, is_active: !j.is_active })}>
                    {j.is_active ? "إغلاق" : "إعادة نشر"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">لم تنشر وظائف بعد.</p>
          )}
        </TabsContent>

        <TabsContent value="shifts" className="mt-6 space-y-3">
          {shifts?.length ? (
            shifts.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(s.starts_at)} · {formatMoney(Number(s.hourly_rate), s.currency)}/ساعة
                  </p>
                </div>
                <Badge variant={s.status === "open" ? "default" : "secondary"}>
                  {s.status === "open" ? "متاحة" : "محجوزة"}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">لا مناوبات منشورة.</p>
          )}
        </TabsContent>

        <TabsContent value="new-job" className="mt-6">
          <JobForm facilityId={facility.id} specialties={specialties ?? []}
            defaults={{ country: facility.country, city: facility.city }}
            quotaReached={!!plan && activeJobs >= plan.active_jobs}
            expired={!!sub && !subActive} />
        </TabsContent>

        <TabsContent value="new-shift" className="mt-6">
          <ShiftForm facilityId={facility.id} specialties={specialties ?? []}
            defaults={{ country: facility.country, city: facility.city }}
            quotaReached={!!plan && activeShifts >= plan.active_shifts}
            expired={!!sub && !subActive} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FacilityForm() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name_ar: "",
    facility_type: "hospital",
    country: "",
    city: "",
    description: "",
    website: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = z
        .object({
          name_ar: z.string().trim().min(2, "أدخل اسم المنشأة").max(120),
          country: z.string().min(1, "اختر الدولة"),
          city: z.string().trim().min(2, "أدخل المدينة").max(60),
        })
        .safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase.from("facilities").insert({
        user_id: user!.id,
        name_ar: form.name_ar.trim(),
        facility_type: form.facility_type,
        country: form.country,
        city: form.city.trim(),
        description: form.description.trim() || null,
        website: form.website.trim() || null,
      });
      if (error) throw error;
      await supabase.rpc("claim_facility_role");
    },
    onSuccess: () => {
      toast.success("تم إنشاء ملف المنشأة");
      queryClient.invalidateQueries({ queryKey: ["my-facility"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذّر الحفظ"),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">سجّل منشأتك</h1>
      <p className="mt-2 text-muted-foreground">دقيقة واحدة وتستطيع نشر أول وظيفة أو مناوبة.</p>

      <div className="card-lift mt-6 space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <Label htmlFor="fname">اسم المنشأة</Label>
          <Input id="fname" maxLength={120} value={form.name_ar}
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>نوع المنشأة</Label>
            <Select value={form.facility_type} onValueChange={(v) => setForm({ ...form, facility_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hospital">مستشفى</SelectItem>
                <SelectItem value="clinic">عيادة</SelectItem>
                <SelectItem value="polyclinic">مجمع طبي</SelectItem>
                <SelectItem value="pharmacy">صيدلية</SelectItem>
                <SelectItem value="lab">مختبر / أشعة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الدولة</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder="اختر الدولة" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fcity">المدينة</Label>
            <Input id="fcity" maxLength={60} value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="fweb">الموقع الإلكتروني</Label>
            <Input id="fweb" dir="ltr" maxLength={200} value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="fdesc">نبذة عن المنشأة</Label>
          <Textarea id="fdesc" rows={4} maxLength={1000} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "جارٍ الحفظ..." : "إنشاء ملف المنشأة"}
        </Button>
      </div>
    </div>
  );
}

type Spec = { id: string; name_ar: string };

function JobForm({
  facilityId,
  specialties,
  defaults,
  quotaReached,
  expired,
}: {
  facilityId: string;
  specialties: Spec[];
  defaults: { country: string; city: string };
  quotaReached?: boolean;
  expired?: boolean;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    specialty_id: "",
    employment_type: "full_time",
    country: defaults.country,
    city: defaults.city,
    salary_min: "",
    salary_max: "",
    currency: "YER",
    required_license: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, country: defaults.country, city: defaults.city }));
  }, [defaults.country, defaults.city]);

  const create = useMutation({
    mutationFn: async () => {
      if (expired) throw new Error("انتهت باقتك — جدّد الاشتراك للنشر من جديد");
      if (quotaReached)
        throw new Error("وصلت حد الوظائف النشطة في باقتك — أغلق وظيفة أو رقّ الباقة");
      const parsed = z
        .object({
          title: z.string().trim().min(3, "أدخل المسمى الوظيفي").max(120),
          description: z.string().trim().min(20, "اكتب وصفاً لا يقل عن ٢٠ حرفاً").max(5000),
          salary_min: z.number().min(0),
          salary_max: z.number().min(0),
        })
        .safeParse({
          title: form.title,
          description: form.description,
          salary_min: Number(form.salary_min),
          salary_max: Number(form.salary_max),
        });
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      if (parsed.data.salary_max < parsed.data.salary_min)
        throw new Error("الحد الأعلى للراتب يجب أن يكون أكبر");

      const { error } = await supabase.from("jobs").insert({
        facility_id: facilityId,
        title: form.title.trim(),
        description: form.description.trim(),
        specialty_id: form.specialty_id || null,
        employment_type: form.employment_type as "full_time",
        country: form.country,
        city: form.city.trim(),
        salary_min: parsed.data.salary_min,
        salary_max: parsed.data.salary_max,
        currency: form.currency,
        min_experience: Number(form.min_experience) || 0,
        required_license: form.required_license || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم نشر الوظيفة");
      setForm({ ...form, title: "", description: "", salary_min: "", salary_max: "" });
      queryClient.invalidateQueries({ queryKey: ["facility-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذّر النشر"),
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="jt">المسمى الوظيفي</Label>
          <Input id="jt" maxLength={120} value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>التخصص</Label>
          <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
            <SelectContent>
              {specialties.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>نوع التوظيف</Label>
          <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="jexp">أقل خبرة مطلوبة (سنوات)</Label>
          <Input id="jexp" type="number" min={0} max={40} value={form.min_experience}
            onChange={(e) => setForm({ ...form, min_experience: e.target.value })} />
        </div>
        <div>
          <Label>الدولة</Label>
          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
            <SelectTrigger><SelectValue placeholder="اختر الدولة" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="jcity">المدينة</Label>
          <Input id="jcity" maxLength={60} value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jmin">الراتب من</Label>
          <Input id="jmin" type="number" min={0} value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jmax">الراتب إلى</Label>
          <Input id="jmax" type="number" min={0} value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jcur">العملة</Label>
          <Input id="jcur" dir="ltr" maxLength={5} value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>ترخيص مطلوب</Label>
          <Select value={form.required_license} onValueChange={(v) => setForm({ ...form, required_license: v })}>
            <SelectTrigger><SelectValue placeholder="بدون / اختر الدولة" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="jdesc">وصف الوظيفة والمتطلبات</Label>
        <Textarea id="jdesc" rows={6} maxLength={5000} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <Button onClick={() => create.mutate()} disabled={create.isPending}>
        {create.isPending ? "جارٍ النشر..." : "نشر الوظيفة"}
      </Button>
    </div>
  );
}

function ShiftForm({
  facilityId,
  specialties,
  defaults,
  quotaReached,
  expired,
}: {
  facilityId: string;
  specialties: Spec[];
  defaults: { country: string; city: string };
  quotaReached?: boolean;
  expired?: boolean;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    specialty_id: "",
    starts_at: "",
    ends_at: "",
    hourly_rate: "",
    currency: "SAR",
    country: defaults.country,
    city: defaults.city,
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (expired) throw new Error("انتهت باقتك — جدّد الاشتراك للنشر من جديد");
      if (quotaReached)
        throw new Error("وصلت حد المناوبات النشطة في باقتك — رقّ الباقة للمزيد");
      if (form.title.trim().length < 3) throw new Error("أدخل عنوان المناوبة");
      if (!form.starts_at || !form.ends_at) throw new Error("حدّد وقت البداية والنهاية");
      if (new Date(form.ends_at) <= new Date(form.starts_at))
        throw new Error("وقت النهاية يجب أن يكون بعد البداية");
      if (!Number(form.hourly_rate)) throw new Error("أدخل الأجر بالساعة");

      const { error } = await supabase.from("shifts").insert({
        facility_id: facilityId,
        title: form.title.trim(),
        specialty_id: form.specialty_id || null,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        hourly_rate: Number(form.hourly_rate),
        currency: form.currency,
        country: form.country,
        city: form.city.trim(),
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم نشر المناوبة");
      setForm({ ...form, title: "", starts_at: "", ends_at: "", hourly_rate: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذّر النشر"),
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="st">عنوان المناوبة</Label>
          <Input id="st" maxLength={120} placeholder="مثال: مناوبة ليلية — طوارئ" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>التخصص</Label>
          <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
            <SelectTrigger><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
            <SelectContent>
              {specialties.map((s) => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ss">البداية</Label>
          <Input id="ss" type="datetime-local" value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="se">النهاية</Label>
          <Input id="se" type="datetime-local" value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="sr">الأجر بالساعة</Label>
          <Input id="sr" type="number" min={0} value={form.hourly_rate}
            onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="scur">العملة</Label>
          <Input id="scur" dir="ltr" maxLength={5} value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>الدولة</Label>
          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
            <SelectTrigger><SelectValue placeholder="اختر الدولة" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="scity">المدينة</Label>
          <Input id="scity" maxLength={60} value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor="snotes">ملاحظات</Label>
        <Textarea id="snotes" rows={3} maxLength={1000} value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button onClick={() => create.mutate()} disabled={create.isPending}>
        {create.isPending ? "جارٍ النشر..." : "نشر المناوبة"}
      </Button>
    </div>
  );
}
