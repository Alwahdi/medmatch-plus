import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowUpCircle,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  Eye,
  PlusCircle,
  Sparkles,
  Users,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { RemoteAvatar } from "@/components/remote-avatar";

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
  countryLabel,
  employmentLabel,
  formatDateTime,
  formatMoney,
  formatSalary,
  specialtyName,
} from "@/lib/format";
import { useLang } from "@/lib/i18n";

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

const TXT = {
  ar: {
    loading: "جارٍ التحميل...",
    verified: " · منشأة موثّقة",
    unverified: " · بانتظار التوثيق",
    applicants: "المتقدمون",
    plan: (name: string) => `باقة ${name}`,
    trial: "تجربة مجانية",
    expired: "منتهية",
    endsAt: (d: string) => `تنتهي في ${d}`,
    activeSub: "اشتراك ساري",
    activeJobsCount: (a: number, b: number) => `الوظائف النشطة ${a}/${b}`,
    activeShiftsCount: (a: number, b: number) => `المناوبات المتاحة ${a}/${b}`,
    upgrade: "ترقية الباقة",
    tabJobs: (n: number) => `الوظائف (${n})`,
    tabShifts: (n: number) => `المناوبات (${n})`,
    tabNewJob: "نشر وظيفة",
    tabNewShift: "نشر مناوبة",
    applicantsCount: (n: number) => `${n} متقدم`,
    published: "منشورة",
    closed: "مغلقة",
    close: "إغلاق",
    republish: "إعادة نشر",
    noJobs: "لم تنشر وظائف بعد.",
    perHour: "/ساعة",
    open: "متاحة",
    bookedStatus: "محجوزة",
    noShifts: "لا مناوبات منشورة.",
    view: "عرض",
    cancelledStatus: "ملغاة",
    cancelShift: "إلغاء",
    shiftCancelled: "تم إلغاء المناوبة",
    confirmCloseTitle: "إغلاق هذه الوظيفة؟",
    confirmCloseDesc: "لن تظهر للباحثين ولن تستقبل طلبات جديدة. يمكنك إعادة نشرها لاحقاً.",
    confirmCloseCta: "نعم، أغلقها",
    confirmCancelShiftTitle: "إلغاء هذه المناوبة؟",
    confirmCancelShiftDesc: "سيتم إلغاء المناوبة وإخفاؤها عن الباحثين، ولا يمكن التراجع.",
    confirmCancelShiftCta: "نعم، ألغِها",

    // Facility form
    registerTitle: "سجّل منشأتك",
    registerSub: "دقيقة واحدة وتستطيع نشر أول وظيفة أو مناوبة.",
    facilityName: "اسم المنشأة",
    facilityType: "نوع المنشأة",
    hospital: "مستشفى",
    clinic: "عيادة",
    polyclinic: "مجمع طبي",
    pharmacy: "صيدلية",
    lab: "مختبر / أشعة",
    country: "الدولة",
    pickCountry: "اختر الدولة",
    city: "المدينة",
    website: "الموقع الإلكتروني",
    description: "نبذة عن المنشأة",
    saving: "جارٍ الحفظ...",
    createFacility: "إنشاء ملف المنشأة",
    createdFacility: "تم إنشاء ملف المنشأة",
    saveFailed: "تعذّر الحفظ",
    nameRequired: "أدخل اسم المنشأة",
    countryRequired: "اختر الدولة",
    cityRequired: "أدخل المدينة",
    // Job form
    jobTitle: "المسمى الوظيفي",
    specialty: "التخصص",
    pickSpecialty: "اختر التخصص",
    employmentType: "نوع التوظيف",
    minExperience: "أقل خبرة مطلوبة (سنوات)",
    salaryFrom: "الراتب من",
    salaryTo: "الراتب إلى",
    currency: "العملة",
    requiredLicense: "ترخيص مطلوب",
    licensePlaceholder: "بدون / اختر الدولة",
    jobDesc: "وصف الوظيفة والمتطلبات",
    publishing: "جارٍ النشر...",
    publishJob: "نشر الوظيفة",
    jobPublished: "تم نشر الوظيفة",
    publishFailed: "تعذّر النشر",
    subExpiredJob: "انتهت باقتك — جدّد الاشتراك للنشر من جديد",
    quotaReachedJob: "وصلت حد الوظائف النشطة في باقتك — أغلق وظيفة أو رقّ الباقة",
    titleMin: "أدخل المسمى الوظيفي",
    descMin: "اكتب وصفاً لا يقل عن ٢٠ حرفاً",
    salaryMaxGt: "الحد الأعلى للراتب يجب أن يكون أكبر",
    // Shift form
    shiftTitle: "عنوان المناوبة",
    shiftTitlePlaceholder: "مثال: مناوبة ليلية — طوارئ",
    shiftStartsAt: "البداية",
    shiftEndsAt: "النهاية",
    hourlyRate: "الأجر بالساعة",
    notes: "ملاحظات",
    publishShift: "نشر المناوبة",
    shiftPublished: "تم نشر المناوبة",
    subExpiredShift: "انتهت باقتك — جدّد الاشتراك للنشر من جديد",
    quotaReachedShift: "وصلت حد المناوبات النشطة في باقتك — رقّ الباقة للمزيد",
    shiftTitleMin: "أدخل عنوان المناوبة",
    setTimes: "حدّد وقت البداية والنهاية",
    endAfterStart: "وقت النهاية يجب أن يكون بعد البداية",
    hourlyRateRequired: "أدخل الأجر بالساعة",
  },
  en: {
    loading: "Loading...",
    verified: " · Verified facility",
    unverified: " · Verification pending",
    applicants: "Applicants",
    plan: (name: string) => `${name} plan`,
    trial: "Free trial",
    expired: "Expired",
    endsAt: (d: string) => `Ends on ${d}`,
    activeSub: "Active subscription",
    activeJobsCount: (a: number, b: number) => `Active jobs ${a}/${b}`,
    activeShiftsCount: (a: number, b: number) => `Open shifts ${a}/${b}`,
    upgrade: "Upgrade plan",
    tabJobs: (n: number) => `Jobs (${n})`,
    tabShifts: (n: number) => `Shifts (${n})`,
    tabNewJob: "Post a job",
    tabNewShift: "Post a shift",
    applicantsCount: (n: number) => `${n} applicants`,
    published: "Published",
    closed: "Closed",
    close: "Close",
    republish: "Republish",
    noJobs: "You haven't posted any jobs yet.",
    perHour: "/hr",
    open: "Open",
    bookedStatus: "Booked",
    noShifts: "No shifts posted.",
    view: "View",
    cancelledStatus: "Cancelled",
    cancelShift: "Cancel",
    shiftCancelled: "Shift cancelled",
    confirmCloseTitle: "Close this job?",
    confirmCloseDesc: "It will be hidden from seekers and stop receiving applications. You can republish later.",
    confirmCloseCta: "Yes, close it",
    confirmCancelShiftTitle: "Cancel this shift?",
    confirmCancelShiftDesc: "The shift will be cancelled and hidden from seekers. This cannot be undone.",
    confirmCancelShiftCta: "Yes, cancel it",

    // Facility form
    registerTitle: "Register your facility",
    registerSub: "One minute and you can post your first job or shift.",
    facilityName: "Facility name",
    facilityType: "Facility type",
    hospital: "Hospital",
    clinic: "Clinic",
    polyclinic: "Polyclinic",
    pharmacy: "Pharmacy",
    lab: "Lab / Imaging",
    country: "Country",
    pickCountry: "Choose a country",
    city: "City",
    website: "Website",
    description: "About the facility",
    saving: "Saving...",
    createFacility: "Create facility profile",
    createdFacility: "Facility profile created",
    saveFailed: "Failed to save",
    nameRequired: "Enter the facility name",
    countryRequired: "Choose a country",
    cityRequired: "Enter the city",
    // Job form
    jobTitle: "Job title",
    specialty: "Specialty",
    pickSpecialty: "Choose a specialty",
    employmentType: "Employment type",
    minExperience: "Minimum experience required (years)",
    salaryFrom: "Salary from",
    salaryTo: "Salary to",
    currency: "Currency",
    requiredLicense: "Required license",
    licensePlaceholder: "None / choose a country",
    jobDesc: "Job description and requirements",
    publishing: "Publishing...",
    publishJob: "Post job",
    jobPublished: "Job posted",
    publishFailed: "Failed to publish",
    subExpiredJob: "Your plan has expired — renew your subscription to post again",
    quotaReachedJob: "You've reached your plan's active job limit — close a job or upgrade",
    titleMin: "Enter a job title",
    descMin: "Write a description of at least 20 characters",
    salaryMaxGt: "The maximum salary must be higher",
    // Shift form
    shiftTitle: "Shift title",
    shiftTitlePlaceholder: "e.g. Night shift — Emergency",
    shiftStartsAt: "Start",
    shiftEndsAt: "End",
    hourlyRate: "Hourly rate",
    notes: "Notes",
    publishShift: "Post shift",
    shiftPublished: "Shift posted",
    subExpiredShift: "Your plan has expired — renew your subscription to post again",
    quotaReachedShift: "You've reached your plan's active shift limit — upgrade for more",
    shiftTitleMin: "Enter a shift title",
    setTimes: "Set the start and end time",
    endAfterStart: "End time must be after start time",
    hourlyRateRequired: "Enter the hourly rate",
  },
} as const;

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
  const { lang } = useLang();
  const c = TXT[lang];
  const { confirm, confirmDialog } = useConfirm();

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
      const { data } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
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

  const cancelShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shifts").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.shiftCancelled);
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">{c.loading}</p>;
  if (!facility) return <FacilityForm />;


  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {confirmDialog}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <RemoteAvatar
            value={facility.logo_url}
            alt={facility.name_ar}
            icon={Building2}
            className="size-12 shrink-0 sm:size-14"
          />

          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-xl font-extrabold sm:text-3xl">
              <span className="truncate">{facility.name_ar}</span>
              {facility.is_verified && <BadgeCheck className="size-5 shrink-0 text-primary sm:size-6" />}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {facility.city}، {countryLabel(facility.country, lang)}
              {facility.is_verified ? c.verified : c.unverified}
            </p>
          </div>
        </div>
        <Button variant="outline" className="w-full gap-2 sm:w-auto" asChild>
          <Link to="/facility/applicants">
            <Users className="size-4" />
            {c.applicants}
          </Link>
        </Button>
      </div>

      {plan && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-bold">
              <Sparkles className="size-5 shrink-0 text-primary" />
              {c.plan(plan.name_ar)}
              {plan.is_trial && <Badge variant="secondary">{c.trial}</Badge>}
              {!subActive && <Badge variant="destructive">{c.expired}</Badge>}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {sub?.ends_at ? c.endsAt(formatDateTime(sub.ends_at, lang)) : c.activeSub}{" "}
              · {c.activeJobsCount(activeJobs, plan.active_jobs)} · {c.activeShiftsCount(activeShifts, plan.active_shifts)}
            </p>
          </div>
          <Button variant="outline" className="w-full gap-2 sm:w-auto" asChild>
            <Link to="/pricing">
              <ArrowUpCircle className="size-4" />
              {c.upgrade}
            </Link>
          </Button>
        </div>
      )}


      <Tabs defaultValue="jobs" className="mt-8">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="w-max">
            <TabsTrigger value="jobs" className="shrink-0 gap-1.5">
              <Briefcase className="size-4" />
              {c.tabJobs(jobs?.length ?? 0)}
            </TabsTrigger>
            <TabsTrigger value="shifts" className="shrink-0 gap-1.5">
              <CalendarClock className="size-4" />
              {c.tabShifts(shifts?.length ?? 0)}
            </TabsTrigger>
            <TabsTrigger value="new-job" className="shrink-0 gap-1.5">
              <PlusCircle className="size-4" />
              {c.tabNewJob}
            </TabsTrigger>
            <TabsTrigger value="new-shift" className="shrink-0 gap-1.5">
              <PlusCircle className="size-4" />
              {c.tabNewShift}
            </TabsTrigger>
          </TabsList>
        </div>


        <TabsContent value="jobs" className="mt-6 space-y-3">
          {jobs?.length ? (
            jobs.map((j) => (
              <div key={j.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    to="/jobs/$jobId"
                    params={{ jobId: j.slug ?? j.id }}
                    className="font-bold hover:text-primary"
                  >
                    {j.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatSalary(Number(j.salary_min), Number(j.salary_max), j.currency, lang)} ·{" "}
                    {employmentLabel(j.employment_type, lang)} · {c.applicantsCount(j.applications?.length ?? 0)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">

                  <Badge variant={j.is_active ? "default" : "secondary"}>
                    {j.is_active ? c.published : c.closed}
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/jobs/$jobId" params={{ jobId: j.slug ?? j.id }}>
                      <Eye className="size-4" /> {c.view}
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/facility/invite" search={{ job: j.id, shift: undefined }}>
                      <UserPlus className="size-4" /> {lang === "ar" ? "دعوة مختصين" : "Invite"}
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={async () => {
                      if (j.is_active) {
                        const ok = await confirm({
                          title: c.confirmCloseTitle,
                          description: c.confirmCloseDesc,
                          confirmLabel: c.confirmCloseCta,
                          destructive: true,
                        });
                        if (!ok) return;
                      }
                      toggleJob.mutate({ id: j.id, is_active: !j.is_active });
                    }}>
                    {j.is_active ? c.close : c.republish}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={Briefcase} title={c.noJobs} />
          )}
        </TabsContent>

        <TabsContent value="shifts" className="mt-6 space-y-3">
          {shifts?.length ? (
            shifts.map((s) => (
              <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link
                    to="/shifts/$shiftId"
                    params={{ shiftId: s.id }}
                    className="font-bold hover:text-primary"
                  >
                    {s.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(s.starts_at, lang)} · {formatMoney(Number(s.hourly_rate), s.currency, lang)}{c.perHour}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">

                  <Badge variant={s.status === "open" ? "default" : "secondary"}>
                    {s.status === "open" ? c.open : s.status === "cancelled" ? c.cancelledStatus : c.bookedStatus}
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/shifts/$shiftId" params={{ shiftId: s.id }}>
                      <Eye className="size-4" /> {c.view}
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/facility/invite" search={{ job: undefined, shift: s.id }}>
                      <UserPlus className="size-4" /> {lang === "ar" ? "دعوة مختصين" : "Invite"}
                    </Link>
                  </Button>
                  {s.status === "open" && (
                    <Button size="sm" variant="ghost"
                      onClick={async () => {
                        const ok = await confirm({
                          title: c.confirmCancelShiftTitle,
                          description: c.confirmCancelShiftDesc,
                          confirmLabel: c.confirmCancelShiftCta,
                          destructive: true,
                        });
                        if (ok) cancelShift.mutate(s.id);
                      }}>
                      {c.cancelShift}
                    </Button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={CalendarClock} title={c.noShifts} />
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
  const { lang } = useLang();
  const c = TXT[lang];
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
          name_ar: z.string().trim().min(2, c.nameRequired).max(120),
          country: z.string().min(1, c.countryRequired),
          city: z.string().trim().min(2, c.cityRequired).max(60),
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
      toast.success(c.createdFacility);
      queryClient.invalidateQueries({ queryKey: ["my-facility"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (e: Error) => toast.error(e.message || c.saveFailed),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.registerTitle}</h1>
      <p className="mt-2 text-muted-foreground">{c.registerSub}</p>

      <div className="card-lift mt-6 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div>
          <Label htmlFor="fname">{c.facilityName}</Label>
          <Input id="fname" maxLength={120} value={form.name_ar}
            onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{c.facilityType}</Label>
            <Select value={form.facility_type} onValueChange={(v) => setForm({ ...form, facility_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hospital">{c.hospital}</SelectItem>
                <SelectItem value="clinic">{c.clinic}</SelectItem>
                <SelectItem value="polyclinic">{c.polyclinic}</SelectItem>
                <SelectItem value="pharmacy">{c.pharmacy}</SelectItem>
                <SelectItem value="lab">{c.lab}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{c.country}</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder={c.pickCountry} /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((x) => <SelectItem key={x} value={x}>{countryLabel(x, lang)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fcity">{c.city}</Label>
            <Input id="fcity" maxLength={60} value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="fweb">{c.website}</Label>
            <Input id="fweb" dir="ltr" maxLength={200} value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="fdesc">{c.description}</Label>
          <Textarea id="fdesc" rows={4} maxLength={1000} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Button className="w-full sm:w-auto" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? c.saving : c.createFacility}
        </Button>
      </div>
    </div>
  );
}

type Spec = { id: string; name_ar: string; name_en?: string | null };

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
  const { lang } = useLang();
  const c = TXT[lang];
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
    min_experience: "0",
    required_license: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, country: defaults.country, city: defaults.city }));
  }, [defaults.country, defaults.city]);

  const create = useMutation({
    mutationFn: async () => {
      if (expired) throw new Error(c.subExpiredJob);
      if (quotaReached) throw new Error(c.quotaReachedJob);
      const parsed = z
        .object({
          title: z.string().trim().min(3, c.titleMin).max(120),
          description: z.string().trim().min(20, c.descMin).max(5000),
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
        throw new Error(c.salaryMaxGt);

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
      toast.success(c.jobPublished);
      setForm({ ...form, title: "", description: "", salary_min: "", salary_max: "" });
      queryClient.invalidateQueries({ queryKey: ["facility-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message || c.publishFailed),
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">

        <div>
          <Label htmlFor="jt">{c.jobTitle}</Label>
          <Input id="jt" maxLength={120} value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>{c.specialty}</Label>
          <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
            <SelectTrigger><SelectValue placeholder={c.pickSpecialty} /></SelectTrigger>
            <SelectContent>
              {specialties.map((s) => <SelectItem key={s.id} value={s.id}>{specialtyName(s, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{c.employmentType}</Label>
          <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["full_time", "part_time", "contract", "locum", "shift"].map((k) => (
                <SelectItem key={k} value={k}>{employmentLabel(k, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="jexp">{c.minExperience}</Label>
          <Input id="jexp" type="number" min={0} max={40} value={form.min_experience}
            onChange={(e) => setForm({ ...form, min_experience: e.target.value })} />
        </div>
        <div>
          <Label>{c.country}</Label>
          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
            <SelectTrigger><SelectValue placeholder={c.pickCountry} /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((x) => <SelectItem key={x} value={x}>{countryLabel(x, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="jcity">{c.city}</Label>
          <Input id="jcity" maxLength={60} value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jmin">{c.salaryFrom}</Label>
          <Input id="jmin" type="number" min={0} value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jmax">{c.salaryTo}</Label>
          <Input id="jmax" type="number" min={0} value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="jcur">{c.currency}</Label>
          <Input id="jcur" dir="ltr" maxLength={5} value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>{c.requiredLicense}</Label>
          <Select value={form.required_license} onValueChange={(v) => setForm({ ...form, required_license: v })}>
            <SelectTrigger><SelectValue placeholder={c.licensePlaceholder} /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((x) => <SelectItem key={x} value={x}>{countryLabel(x, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="jdesc">{c.jobDesc}</Label>
        <Textarea id="jdesc" rows={6} maxLength={5000} value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      {(expired || quotaReached) && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {expired ? c.subExpiredJob : c.quotaReachedJob}
        </p>
      )}
      <Button className="w-full sm:w-auto" onClick={() => create.mutate()} disabled={create.isPending || expired || quotaReached}>
        {create.isPending ? c.publishing : c.publishJob}
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
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    specialty_id: "",
    starts_at: "",
    ends_at: "",
    hourly_rate: "",
    currency: "YER",
    country: defaults.country,
    city: defaults.city,
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      if (expired) throw new Error(c.subExpiredShift);
      if (quotaReached) throw new Error(c.quotaReachedShift);
      if (form.title.trim().length < 3) throw new Error(c.shiftTitleMin);
      if (!form.starts_at || !form.ends_at) throw new Error(c.setTimes);
      if (new Date(form.ends_at) <= new Date(form.starts_at))
        throw new Error(c.endAfterStart);
      if (!Number(form.hourly_rate)) throw new Error(c.hourlyRateRequired);

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
      toast.success(c.shiftPublished);
      setForm({ ...form, title: "", starts_at: "", ends_at: "", hourly_rate: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e: Error) => toast.error(e.message || c.publishFailed),
  });

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">

        <div>
          <Label htmlFor="st">{c.shiftTitle}</Label>
          <Input id="st" maxLength={120} placeholder={c.shiftTitlePlaceholder} value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>{c.specialty}</Label>
          <Select value={form.specialty_id} onValueChange={(v) => setForm({ ...form, specialty_id: v })}>
            <SelectTrigger><SelectValue placeholder={c.pickSpecialty} /></SelectTrigger>
            <SelectContent>
              {specialties.map((s) => <SelectItem key={s.id} value={s.id}>{specialtyName(s, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="ss">{c.shiftStartsAt}</Label>
          <Input id="ss" type="datetime-local" value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="se">{c.shiftEndsAt}</Label>
          <Input id="se" type="datetime-local" value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="sr">{c.hourlyRate}</Label>
          <Input id="sr" type="number" min={0} value={form.hourly_rate}
            onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="scur">{c.currency}</Label>
          <Input id="scur" dir="ltr" maxLength={5} value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>{c.country}</Label>
          <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
            <SelectTrigger><SelectValue placeholder={c.pickCountry} /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((x) => <SelectItem key={x} value={x}>{countryLabel(x, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="scity">{c.city}</Label>
          <Input id="scity" maxLength={60} value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor="snotes">{c.notes}</Label>
        <Textarea id="snotes" rows={3} maxLength={1000} value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      {(expired || quotaReached) && (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {expired ? c.subExpiredShift : c.quotaReachedShift}
        </p>
      )}
      <Button className="w-full sm:w-auto" onClick={() => create.mutate()} disabled={create.isPending || expired || quotaReached}>
        {create.isPending ? c.publishing : c.publishShift}
      </Button>
    </div>
  );
}
