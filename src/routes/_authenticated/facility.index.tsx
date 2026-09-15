import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FacilityApplicantsPanel } from "@/components/panels/facility.applicants";
import { FacilityBookingsPanel } from "@/components/panels/facility.bookings";
import { InvitePanel } from "@/components/panels/invite";
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
  MessageSquare,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  Users,
  UserPlus,
  MoreHorizontal,
  PauseCircle,
  CheckCircle2,
  CircleSlash,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { RemoteAvatar } from "@/components/remote-avatar";
import { PublishedWorkCard, WorkCountButton } from "@/components/work-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { Combobox, comboText } from "@/components/ui/combobox";
import { cityOptions, countryOptions, currencyOptions } from "@/lib/geo";
import {
  countryLabel,
  employmentLabel,
  formatDateTime,
  formatMoney,
  formatSalary,
  specialtyName,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useUnread } from "@/lib/unread";

type FacilitySearch = { tab?: string };

export const Route = createFileRoute("/_authenticated/facility/")({
  validateSearch: (search: Record<string, unknown>): FacilitySearch =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
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
    publish: "نشر جديد",
    verifyNow: "أكمل توثيق منشأتك",
    verifyBody: "ارفع المستندات المطلوبة ليظهر للكوادر أن منشأتك موثّقة.",
    newApplicants: "طلبات جديدة",
    unreadMessages: "رسائل غير مقروءة",
    activeJobs: "وظائف نشطة",
    openShifts: "مناوبات متاحة",
    searchesRemaining: (n: number) => `${n} عملية بحث متبقية`,
    loadFailed: "تعذّر تحميل بيانات المنشأة.",
    retry: "إعادة المحاولة",
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
    moreActions: "إجراءات أخرى",
    tabAll: (n: number) => `الكل (${n})`,
    invite: "دعوة مختصين",
    confirmCompleteTitle: "إنهاء المناوبة؟",
    confirmCompleteDesc: "سيتم تسجيل المناوبة كمنتهية ولا يمكن التراجع.",
    confirmCompleteCta: "إنهاء المناوبة",

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
    startInPast: "وقت البداية يجب أن يكون في المستقبل",
    tooLong: "مدة المناوبة الواحدة لا تتجاوز 24 ساعة — تحقق من التاريخ",
    hourlyRateRequired: "أدخل الأجر بالساعة",
    // Review step
    reviewCta: "مراجعة قبل النشر",
    reviewTitle: "راجع التفاصيل قبل النشر",
    reviewSub: "تأكد من صحة البيانات. يمكنك الرجوع والتعديل قبل النشر.",
    backToEdit: "رجوع وتعديل",
    confirmPublish: "تأكيد النشر",
    notSet: "غير محدد",
    none: "بدون",
    salaryRange: "نطاق الراتب",
    duration: (h: string) => `المدة: ${h} ساعة`,
    // Post-publish
    publishedTitle: "تم النشر بنجاح",
    publishedSubJob: "وظيفتك أصبحت مرئية للكوادر. تستطيع الآن دعوة مختصين مباشرة لها.",
    publishedSubShift: "مناوبتك أصبحت مرئية للكوادر. تستطيع الآن دعوة مختصين مباشرة لها.",
    inviteNow: "دعوة مختصين الآن",
    doneLater: "لاحقاً",
    inviteDialogTitle: "دعوة مختصين",
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
    publish: "Create listing",
    verifyNow: "Complete facility verification",
    verifyBody: "Upload the required documents so professionals can trust your verified facility badge.",
    newApplicants: "New applications",
    unreadMessages: "Unread messages",
    activeJobs: "Active jobs",
    openShifts: "Open shifts",
    searchesRemaining: (n: number) => `${n} searches remaining`,
    loadFailed: "We couldn't load your facility data.",
    retry: "Try again",
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
    moreActions: "More actions",
    tabAll: (n: number) => `All (${n})`,
    invite: "Invite professionals",
    confirmCompleteTitle: "Complete shift?",
    confirmCompleteDesc: "The shift will be marked completed and cannot be reverted.",
    confirmCompleteCta: "Complete shift",

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
    startInPast: "Start time must be in the future",
    tooLong: "A single shift can't exceed 24 hours — check the date",
    hourlyRateRequired: "Enter the hourly rate",
    // Review step
    reviewCta: "Review before publishing",
    reviewTitle: "Review the details before publishing",
    reviewSub: "Check everything is correct. You can go back and edit before publishing.",
    backToEdit: "Back to edit",
    confirmPublish: "Confirm and publish",
    notSet: "Not set",
    none: "None",
    salaryRange: "Salary range",
    duration: (h: string) => `Duration: ${h} hours`,
    // Post-publish
    publishedTitle: "Published successfully",
    publishedSubJob: "Your job is now visible to professionals. You can invite specialists directly.",
    publishedSubShift: "Your shift is now visible to professionals. You can invite specialists directly.",
    inviteNow: "Invite professionals now",
    doneLater: "Later",
    inviteDialogTitle: "Invite professionals",
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
  searches_used: number;
  subscription_plans: PlanRow | null;
};

/** رسائل واضحة بدل أكواد قاعدة البيانات. */
function shiftErrorText(raw: string, lang: "ar" | "en") {
  if (raw.includes("SHIFT_FINAL_STATE") || raw.includes("INVALID_SHIFT_TRANSITION"))
    return lang === "ar" ? "لا يمكن تغيير حالة هذه المناوبة بعد الآن." : "This shift's status can no longer change.";
  if (raw.includes("SHIFT_NOT_COMPLETABLE"))
    return lang === "ar"
      ? "لا يمكن إنهاء المناوبة إلا بعد انتهاء وقتها وكونها محجوزة."
      : "A shift can only be completed once it is booked and its time has passed.";
  return raw;
}

function FacilityDashboard() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { confirm, confirmDialog } = useConfirm();
  const rawTab = Route.useSearch().tab ?? "all";
  // توافق خلفي: الروابط القديمة new-job/new-shift تفتح القسم الصحيح مع نافذة الإنشاء.
  const legacyCreate = rawTab === "new-job" ? "job" : rawTab === "new-shift" ? "shift" : null;
  const tab = rawTab === "new-job" ? "jobs" : rawTab === "new-shift" ? "shifts" : rawTab;
  const navigate = useNavigate();
  const [openApplicants, setOpenApplicants] = useState<string | null>(null);
  const [openBookings, setOpenBookings] = useState<string | null>(null);
  const [createMode, setCreateMode] = useState<"job" | "shift" | null>(legacyCreate);
  type WorkRef = { kind: "job" | "shift"; id: string };
  const [justPublished, setJustPublished] = useState<WorkRef | null>(null);
  const [inviteTarget, setInviteTarget] = useState<WorkRef | null>(null);

  const { user } = useSession();
  const { total: unreadMessages } = useUnread(user);
  const queryClient = useQueryClient();

  const facilityQuery = useQuery({
    queryKey: ["my-facility", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: facility, isLoading } = facilityQuery;

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
      const { data, error } = await supabase
        .from("jobs")
        .select("*,applications(id,status)")
        .eq("facility_id", facility!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ["facility-shifts", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*,shift_bookings(id,status)")
        .eq("facility_id", facility!.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sub } = useQuery({
    queryKey: ["facility-sub", facility?.id],
    enabled: !!facility,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facility_subscriptions")
        .select("*,subscription_plans(*)")
        .eq("facility_id", facility!.id)
        .maybeSingle();
      if (error) throw error;
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
  const newApplicants = (jobs ?? []).reduce(
    (count, job) => count + (job.applications ?? []).filter((application) => application.status === "submitted").length,
    0,
  );
  const searchesRemaining = plan
    ? Math.max(plan.candidate_searches - (sub?.searches_used ?? 0), 0)
    : null;

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
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e: Error) => toast.error(shiftErrorText(e.message, lang)),
  });

  const completeShift = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("complete_shift", { _shift_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم إنهاء المناوبة" : "Shift completed");
      queryClient.invalidateQueries({ queryKey: ["facility-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: (e: Error) => toast.error(shiftErrorText(e.message, lang)),
  });

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">{c.loading}</p>;
  if (facilityQuery.isError) {
    return (
      <EmptyState
        className="mx-auto mt-10 max-w-2xl"
        icon={ShieldAlert}
        title={c.loadFailed}
        action={<Button variant="outline" onClick={() => void facilityQuery.refetch()}>{c.retry}</Button>}
      />
    );
  }
  if (!facility) return <FacilityForm />;


  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {confirmDialog}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full min-h-11 sm:w-auto">
              <PlusCircle className="size-4" /> {lang === "ar" ? "نشر" : "Create"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="min-h-11 gap-2"
              onSelect={() => {
                setCreateMode("job");
                void navigate({ to: "/facility", search: { tab: "jobs" }, replace: true });
              }}
            >
              <Briefcase className="size-4" /> {c.tabNewJob}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11 gap-2"
              onSelect={() => {
                setCreateMode("shift");
                void navigate({ to: "/facility", search: { tab: "shifts" }, replace: true });
              }}
            >
              <CalendarClock className="size-4" /> {c.tabNewShift}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={createMode !== null}
        onOpenChange={(o) => {
          if (!o) {
            setCreateMode(null);
            setJustPublished(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {justPublished ? c.publishedTitle : createMode === "shift" ? c.tabNewShift : c.tabNewJob}
            </DialogTitle>
          </DialogHeader>
          {justPublished ? (
            <div className="space-y-4 py-2 text-center">
              <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
              <p className="text-sm text-muted-foreground">
                {justPublished.kind === "shift" ? c.publishedSubShift : c.publishedSubJob}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  onClick={() => {
                    setInviteTarget(justPublished);
                    setJustPublished(null);
                    setCreateMode(null);
                  }}
                >
                  <UserPlus className="size-4" /> {c.inviteNow}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setJustPublished(null);
                    setCreateMode(null);
                  }}
                >
                  {c.doneLater}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {createMode === "job" && (
                <JobForm
                  facilityId={facility.id}
                  specialties={specialties ?? []}
                  defaults={{ country: facility.country, city: facility.city }}
                  quotaReached={!!plan && activeJobs >= plan.active_jobs}
                  expired={!!sub && !subActive}
                  onCreated={(id) => setJustPublished({ kind: "job", id })}
                />
              )}
              {createMode === "shift" && (
                <ShiftForm
                  facilityId={facility.id}
                  specialties={specialties ?? []}
                  defaults={{ country: facility.country, city: facility.city }}
                  quotaReached={!!plan && activeShifts >= plan.active_shifts}
                  expired={!!sub && !subActive}
                  onCreated={(id) => setJustPublished({ kind: "shift", id })}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={inviteTarget !== null} onOpenChange={(o) => !o && setInviteTarget(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{c.inviteDialogTitle}</DialogTitle>
          </DialogHeader>
          {inviteTarget && (
            <InvitePanel
              jobId={inviteTarget.kind === "job" ? inviteTarget.id : undefined}
              shiftId={inviteTarget.kind === "shift" ? inviteTarget.id : undefined}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric icon={Users} value={newApplicants} label={c.newApplicants} />
        <DashboardMetric icon={MessageSquare} value={unreadMessages} label={c.unreadMessages} />
        <DashboardMetric icon={Briefcase} value={activeJobs} label={c.activeJobs} />
        <DashboardMetric icon={CalendarClock} value={activeShifts} label={c.openShifts} />
      </div>

      {!facility.is_verified && (
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center">
          <ShieldAlert className="size-6 shrink-0 text-warning-foreground" />
          <div className="min-w-0">
            <p className="font-bold">{c.verifyNow}</p>
            <p className="text-sm text-muted-foreground">{c.verifyBody}</p>
          </div>
          <Button className="sm:ms-auto" variant="outline" asChild>
            <Link to="/facility/profile" search={{ tab: "verification" }}>{c.verifyNow}</Link>
          </Button>
        </div>
      )}

      {plan && (
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
               {searchesRemaining !== null ? ` · ${c.searchesRemaining(searchesRemaining)}` : ""}
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


      <div className="mt-8 -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex items-center gap-1 rounded-xl bg-surface p-1" role="tablist">
          {(
            [
              ["all", c.tabAll((jobs?.length ?? 0) + (shifts?.length ?? 0)), Layers],
              ["jobs", c.tabJobs(jobs?.length ?? 0), Briefcase],
              ["shifts", c.tabShifts(shifts?.length ?? 0), CalendarClock],
            ] as [string, string, typeof Briefcase][]
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => void navigate({ to: "/facility", search: { tab: key }, replace: true })}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

        <div className={cn("mt-6 space-y-3", tab === "shifts" && "hidden")}>
          {jobs?.length ? (
            jobs.map((j) => {
              const applicants = j.applications?.length ?? 0;
              return (
                <PublishedWorkCard
                  key={j.id}
                  type="job"
                  title={j.title}
                  to="/jobs/$jobId"
                  params={{ jobId: j.slug ?? j.id }}
                  status={j.is_active ? "published" : "closed"}
                  meta={
                    <>
                      {formatSalary(Number(j.salary_min), Number(j.salary_max), j.currency, lang)} ·{" "}
                      {employmentLabel(j.employment_type, lang)} · {j.city}
                    </>
                  }
                  actions={
                    <>
                      <WorkCountButton
                        type="job"
                        count={applicants}
                        expanded={openApplicants === j.id}
                        onToggle={() => setOpenApplicants((v) => (v === j.id ? null : j.id))}
                      />
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/jobs/$jobId" params={{ jobId: j.slug ?? j.id }}>
                          <Eye className="size-4" /> {c.view}
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="size-9 p-0" aria-label={c.moreActions}>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {j.is_active && (
                            <DropdownMenuItem
                              className="min-h-11 gap-2"
                              onSelect={() => setInviteTarget({ kind: "job", id: j.id })}
                            >
                              <UserPlus className="size-4" /> {c.invite}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="min-h-11 gap-2"
                            disabled={toggleJob.isPending}
                            onSelect={async () => {
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
                            }}
                          >
                            {j.is_active ? <PauseCircle className="size-4" /> : <PlusCircle className="size-4" />}
                            {j.is_active ? c.close : c.republish}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  }
                >
                  {openApplicants === j.id && <FacilityApplicantsPanel jobId={j.id} embedded />}
                </PublishedWorkCard>
              );
            })
          ) : (
            <EmptyState icon={Briefcase} title={c.noJobs} />
          )}
        </div>

        <div className={cn("mt-6 space-y-3", tab === "jobs" && "hidden")}>
          {shifts?.length ? (
            shifts.map((s) => {
              const ended = new Date(s.ends_at).getTime() <= Date.now();
              // الحجوزات الفعلية (نستثني الملغاة).
              const bookingRows = (
                Array.isArray(s.shift_bookings) ? s.shift_bookings : s.shift_bookings ? [s.shift_bookings] : []
              ) as { id: string; status: string }[];
              const bookings = bookingRows.filter((b) => b.status !== "cancelled").length;
              return (
                <PublishedWorkCard
                  key={s.id}
                  type="shift"
                  title={s.title}
                  to="/shifts/$shiftId"
                  params={{ shiftId: s.id }}
                  status={s.status as "open" | "booked" | "cancelled" | "completed"}
                  meta={
                    <>
                      {formatDateTime(s.starts_at, lang)} ·{" "}
                      {formatMoney(Number(s.hourly_rate), s.currency, lang)}
                      {c.perHour} · {s.city}
                    </>
                  }
                  actions={
                    <>
                      <WorkCountButton
                        type="shift"
                        count={bookings}
                        expanded={openBookings === s.id}
                        onToggle={() => setOpenBookings((v) => (v === s.id ? null : s.id))}
                      />
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/shifts/$shiftId" params={{ shiftId: s.id }}>
                          <Eye className="size-4" /> {c.view}
                        </Link>
                      </Button>
                      {(s.status === "open" || s.status === "booked") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="size-9 p-0" aria-label={c.moreActions}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {s.status === "open" && (
                              <DropdownMenuItem
                                className="min-h-11 gap-2"
                                onSelect={() => setInviteTarget({ kind: "shift", id: s.id })}
                              >
                                <UserPlus className="size-4" /> {c.invite}
                              </DropdownMenuItem>
                            )}
                            {s.status === "booked" && ended && (
                              <DropdownMenuItem
                                className="min-h-11 gap-2"
                                disabled={completeShift.isPending}
                                onSelect={async () => {
                                  const ok = await confirm({
                                    title: c.confirmCompleteTitle,
                                    description: c.confirmCompleteDesc,
                                    confirmLabel: c.confirmCompleteCta,
                                  });
                                  if (ok) completeShift.mutate(s.id);
                                }}
                              >
                                <CheckCircle2 className="size-4" /> {c.confirmCompleteCta}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="min-h-11 gap-2"
                              disabled={cancelShift.isPending}
                              onSelect={async () => {
                                const ok = await confirm({
                                  title: c.confirmCancelShiftTitle,
                                  description: c.confirmCancelShiftDesc,
                                  confirmLabel: c.confirmCancelShiftCta,
                                  destructive: true,
                                });
                                if (ok) cancelShift.mutate(s.id);
                              }}
                            >
                              <CircleSlash className="size-4" /> {c.cancelShift}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </>
                  }
                >
                  {openBookings === s.id && facility && (
                    <FacilityBookingsPanel
                      shiftId={s.id}
                      facilityId={facility.id}
                      shiftCompleted={s.status === "completed"}
                    />
                  )}
                </PublishedWorkCard>
              );
            })
          ) : (
            <EmptyState icon={CalendarClock} title={c.noShifts} />
          )}
        </div>


    </div>
  );
}

function DashboardMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Briefcase;
  value: number;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function FacilityForm() {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
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
            <Combobox
              options={[
                { value: "hospital", label: c.hospital },
                { value: "clinic", label: c.clinic },
                { value: "polyclinic", label: c.polyclinic },
                { value: "pharmacy", label: c.pharmacy },
                { value: "lab", label: c.lab },
              ]}
              value={form.facility_type}
              onChange={(v) => setForm({ ...form, facility_type: v })}
              placeholder={c.facilityType}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </div>
          <div>
            <Label>{c.country}</Label>
            <Combobox
              options={countryOptions(lang)}
              value={form.country}
              onChange={(v) => setForm({ ...form, country: v, city: "" })}
              placeholder={c.pickCountry}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
            />
          </div>
          <div>
            <Label>{c.city}</Label>
            <Combobox
              options={cityOptions(form.country, lang)}
              value={form.city}
              disabled={!form.country}
              onChange={(v) => setForm({ ...form, city: v })}
              placeholder={form.country ? ct.choose : ct.pickCountryFirst}
              searchPlaceholder={ct.search}
              emptyText={ct.empty}
              allowCustom
              customLabel={ct.add}
            />
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
  onCreated,
}: {
  facilityId: string;
  specialties: Spec[];
  defaults: { country: string; city: string };
  quotaReached?: boolean;
  expired?: boolean;
  onCreated?: (id: string) => void;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "review">("form");
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

  /** تحقق كامل قبل عرض شاشة المراجعة أو النشر. */
  function validate() {
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
    if (parsed.data.salary_max < parsed.data.salary_min) throw new Error(c.salaryMaxGt);
    if (!form.country) throw new Error(c.countryRequired);
    if (!form.city.trim()) throw new Error(c.cityRequired);
    return parsed.data;
  }

  function goReview() {
    try {
      validate();
      setStep("review");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const create = useMutation({
    mutationFn: async () => {
      const parsed = validate();
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          facility_id: facilityId,
          title: form.title.trim(),
          description: form.description.trim(),
          specialty_id: form.specialty_id || null,
          employment_type: form.employment_type as "full_time",
          country: form.country,
          city: form.city.trim(),
          salary_min: parsed.salary_min,
          salary_max: parsed.salary_max,
          currency: form.currency,
          min_experience: Number(form.min_experience) || 0,
          required_license: form.required_license || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success(c.jobPublished);
      setForm({ ...form, title: "", description: "", salary_min: "", salary_max: "" });
      setStep("form");
      queryClient.invalidateQueries({ queryKey: ["facility-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onCreated?.(id);
      void navigate({ to: "/facility", search: { tab: "jobs" }, replace: true });
    },
    onError: (e: Error) => toast.error(e.message || c.publishFailed),
  });

  if (step === "review") {
    const specName = specialtyName(specialties.find((s) => s.id === form.specialty_id), lang);
    return (
      <ReviewStep
        title={c.reviewTitle}
        subtitle={c.reviewSub}
        rows={[
          { label: c.jobTitle, value: form.title.trim() },
          { label: c.specialty, value: specName ?? c.notSet },
          { label: c.employmentType, value: employmentLabel(form.employment_type, lang) },
          { label: c.minExperience, value: String(Number(form.min_experience) || 0) },
          {
            label: c.country + " / " + c.city,
            value: [countryLabel(form.country, lang), form.city.trim()].filter(Boolean).join(" — "),
          },
          {
            label: c.salaryRange,
            value: `${Number(form.salary_min).toLocaleString()} – ${Number(form.salary_max).toLocaleString()} ${form.currency}`,
          },
          { label: c.requiredLicense, value: form.required_license ? countryLabel(form.required_license, lang) : c.none },
          { label: c.jobDesc, value: form.description.trim() },
        ]}
        backLabel={c.backToEdit}
        confirmLabel={create.isPending ? c.publishing : c.confirmPublish}
        onBack={() => setStep("form")}
        onConfirm={() => create.mutate()}
        pending={create.isPending}
      />
    );
  }

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
          <Combobox
            options={specialties.map((s) => ({
              value: s.id,
              label: specialtyName(s, lang) ?? "",
              keywords: [s.name_ar, s.name_en].filter(Boolean) as string[],
            }))}
            value={form.specialty_id}
            onChange={(v) => setForm({ ...form, specialty_id: v })}
            placeholder={c.pickSpecialty}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.employmentType}</Label>
          <Combobox
            options={["full_time", "part_time", "contract", "locum", "shift"].map((k) => ({
              value: k,
              label: employmentLabel(k, lang),
              keywords: [k],
            }))}
            value={form.employment_type}
            onChange={(v) => setForm({ ...form, employment_type: v })}
            placeholder={ct.choose}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label htmlFor="jexp">{c.minExperience}</Label>
          <Input id="jexp" type="number" min={0} max={40} value={form.min_experience}
            onChange={(e) => setForm({ ...form, min_experience: e.target.value })} />
        </div>
        <div>
          <Label>{c.country}</Label>
          <Combobox
            options={countryOptions(lang)}
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v, city: "" })}
            placeholder={c.pickCountry}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.city}</Label>
          <Combobox
            options={cityOptions(form.country, lang)}
            value={form.city}
            disabled={!form.country}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder={form.country ? ct.choose : ct.pickCountryFirst}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
            allowCustom
            customLabel={ct.add}
          />
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
          <Label>{c.currency}</Label>
          <Combobox
            options={currencyOptions(lang)}
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
            placeholder={ct.choose}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.requiredLicense}</Label>
          <Combobox
            options={countryOptions(lang)}
            value={form.required_license}
            onChange={(v) => setForm({ ...form, required_license: v })}
            placeholder={c.licensePlaceholder}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
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
  onCreated,
}: {
  facilityId: string;
  specialties: Spec[];
  defaults: { country: string; city: string };
  quotaReached?: boolean;
  expired?: boolean;
  onCreated?: () => void;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const ct = comboText(lang);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
      const startMs = new Date(form.starts_at).getTime();
      const endMs = new Date(form.ends_at).getTime();
      if (endMs <= startMs) throw new Error(c.endAfterStart);
      if (startMs <= Date.now()) throw new Error(c.startInPast);
      if (endMs - startMs > 24 * 60 * 60 * 1000) throw new Error(c.tooLong);
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
      onCreated?.();
      void navigate({ to: "/facility", search: { tab: "shifts" }, replace: true });
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
          <Combobox
            options={specialties.map((s) => ({
              value: s.id,
              label: specialtyName(s, lang) ?? "",
              keywords: [s.name_ar, s.name_en].filter(Boolean) as string[],
            }))}
            value={form.specialty_id}
            onChange={(v) => setForm({ ...form, specialty_id: v })}
            placeholder={c.pickSpecialty}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label htmlFor="ss">{c.shiftStartsAt}</Label>
          <Input id="ss" type="datetime-local" value={form.starts_at}
            onChange={(e) => {
              const v = e.target.value;
              let end = form.ends_at;
              const startMs = new Date(v).getTime();
              if (v && (!end || new Date(end).getTime() <= startMs || new Date(end).getTime() - startMs > 24 * 3600_000)) {
                const d = new Date(startMs + 8 * 3600_000);
                const pad = (n: number) => String(n).padStart(2, "0");
                end = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              }
              setForm({ ...form, starts_at: v, ends_at: end });
            }} />
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
          <Label>{c.currency}</Label>
          <Combobox
            options={currencyOptions(lang)}
            value={form.currency}
            onChange={(v) => setForm({ ...form, currency: v })}
            placeholder={ct.choose}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.country}</Label>
          <Combobox
            options={countryOptions(lang)}
            value={form.country}
            onChange={(v) => setForm({ ...form, country: v, city: "" })}
            placeholder={c.pickCountry}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
          />
        </div>
        <div>
          <Label>{c.city}</Label>
          <Combobox
            options={cityOptions(form.country, lang)}
            value={form.city}
            disabled={!form.country}
            onChange={(v) => setForm({ ...form, city: v })}
            placeholder={form.country ? ct.choose : ct.pickCountryFirst}
            searchPlaceholder={ct.search}
            emptyText={ct.empty}
            allowCustom
            customLabel={ct.add}
          />
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
