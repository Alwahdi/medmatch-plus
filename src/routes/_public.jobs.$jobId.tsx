import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, MapPin, Wallet, BriefcaseMedical, ShieldCheck, Clock, Bookmark, BookmarkCheck, ArrowLeft, Loader2 } from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { engagementErrorText } from "@/lib/engagement-errors";
import { supabase } from "@/integrations/supabase/client";
import { useMyFacility, useSession } from "@/lib/auth";
import { OwnerListingPanel } from "@/components/owner-listing-panel";
import { employmentLabel, experienceLabel, formatDate, formatSalary, relativeTime, specialtyName } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { toastUndo } from "@/lib/undo";
import { ErrorState } from "@/components/error-state";

const TXT = {
  ar: {
    tooLong: "الرسالة طويلة جداً",
    notFoundTitle: "هذه الوظيفة لم تعد متاحة",
    browseOther: "تصفح وظائف أخرى",
    back: "العودة للوظائف",
    hiddenEmployer: "ناشر الوظيفة محجوب لحماية خصوصية المنشأة",
    verifiedEmployer: "ناشر موثّق",
    applications: (n: number) => `تقدّم ${n}`,
    salaryLabel: "الراتب الشهري",
    location: "الموقع",
    employment: "نوع التوظيف",
    minExp: "الحد الأدنى للخبرة",
    years: (n: number) => `${n} سنوات`,
    specialty: "التخصص",
    licenseBadge: (l: string) => `ترخيص ${l}`,
    postedBadge: (t: string) => `نُشرت ${t}`,
    description: "وصف الوظيفة",
    requirements: "المتطلبات",
    expReq: (n: number, s: string) => `خبرة لا تقل عن ${n} سنوات في ${s}`,
    defaultSpecialty: "التخصص المطلوب",
    licenseReq: (l: string) => `ترخيص مزاولة مهنة سارٍ من ${l}`,
    teamworkReq: "إجادة العمل ضمن فريق متعدد التخصصات",
    privacyNote:
      "هوية المنشأة الناشرة تظهر لك مباشرة بعد قبول طلبك أو بدء التواصل معك، وتظهر حالة توثيق الناشر على صفحة الفرصة.",
    applyTitle: "التقديم على الوظيفة",
    signInPrompt: "سجّل دخولك كي تتقدم وتتابع حالة طلبك خطوة بخطوة.",
    signInCta: "تسجيل الدخول للتقديم",
    alreadyApplied: "تم التقديم على هذه الوظيفة مسبقاً. تابع الحالة من",
    myApplicationsPage: "صفحة طلباتي",
    coverPlaceholder: "اكتب رسالة تعريفية مختصرة (اختياري): خبرتك، سبب اهتمامك، وتاريخ الالتحاق الممكن.",
    coverLabel: "رسالة تعريفية",
    optional: "اختياري",
    applyHint: "سيصل طلبك مع ملفك المهني مباشرة إلى ناشر الوظيفة، ويمكنك متابعة حالته من صفحة طلباتي.",
    sending: "جارٍ الإرسال...",
    sendApply: "أرسل الطلب",
    home: "الرئيسية",
    jobsCrumb: "الوظائف الطبية",
    vacancies: "الوظائف المتاحة",
    deadline: "الموعد النهائي",
    noDeadline: "غير محدد",
    open: "مفتوحة",
    closed: "مغلقة",
    notAccepting: "لم تعد تستقبل طلبات",
    publishedBy: "نُشرت بواسطة",
    saved: "محفوظة",
    saveJob: "حفظ الوظيفة",
    savedToast: "تم حفظ الوظيفة",
    removedToast: "تمت إزالة الوظيفة من المحفوظات",
    saveFailed: "تعذّر تحديث المحفوظات",
    appliedToast: "تم إرسال طلبك بنجاح",
    applyFailed: "تعذّر إرسال الطلب",
    coverCount: (n: number) => `${n} من 2000 حرف`,
    appliedNext: "تم إرسال طلبك. تابع مرحلته وأي مقابلة جديدة من نشاطك.",
    trackApplication: "متابعة الطلب",
    revealedPrivacy: "أصبحت هوية المنشأة ظاهرة لك لأن التواصل أو الطلب بينكما بدأ بالفعل.",
  },
  en: {
    tooLong: "Message is too long",
    notFoundTitle: "This job is no longer available",
    browseOther: "Browse other jobs",
    back: "Back to jobs",
    hiddenEmployer: "Employer identity is hidden to protect the facility's privacy",
    verifiedEmployer: "Verified employer",
    applications: (n: number) => `${n} applications`,
    salaryLabel: "Monthly salary",
    location: "Location",
    employment: "Employment type",
    minExp: "Minimum experience",
    years: (n: number) => `${n} years`,
    specialty: "Specialty",
    licenseBadge: (l: string) => `License ${l}`,
    postedBadge: (t: string) => `Posted ${t}`,
    description: "Job description",
    requirements: "Requirements",
    expReq: (n: number, s: string) => `At least ${n} years of experience in ${s}`,
    defaultSpecialty: "the required specialty",
    licenseReq: (l: string) => `Valid professional license from ${l}`,
    teamworkReq: "Ability to work well within a multidisciplinary team",
    privacyNote:
      "The employer's identity is revealed once your application is accepted or they reach out to you, and each employer's verification status is shown on the listing.",
    applyTitle: "Apply for this job",
    signInPrompt: "Sign in to apply and track your application status step by step.",
    signInCta: "Sign in to apply",
    alreadyApplied: "You've already applied to this job. Track its status from",
    myApplicationsPage: "My applications",
    coverPlaceholder: "Write a brief cover message (optional): your experience, why you're interested, and your possible start date.",
    coverLabel: "Cover message",
    optional: "optional",
    applyHint: "Your application is sent with your professional profile, and you can track its status from My applications.",
    sending: "Sending...",
    sendApply: "Send application",
    home: "Home",
    jobsCrumb: "Medical jobs",
    vacancies: "Open positions",
    deadline: "Application deadline",
    noDeadline: "Not set",
    open: "Open",
    closed: "Closed",
    notAccepting: "No longer accepting applications",
    publishedBy: "Published by",
    saved: "Saved",
    saveJob: "Save job",
    savedToast: "Job saved",
    removedToast: "Job removed from saved list",
    saveFailed: "Could not update saved jobs",
    appliedToast: "Your application was sent successfully",
    applyFailed: "Could not send the application",
    coverCount: (n: number) => `${n} of 2,000 characters`,
    appliedNext: "Your application was sent. Track its stage and any interview updates from your activity.",
    trackApplication: "Track application",
    revealedPrivacy: "The employer identity is visible because contact or an application relationship has already started.",
  },
} as const;

export const Route = createFileRoute("/_public/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "تفاصيل الوظيفة | Job details | SyndeoCare" },
      {
        name: "description",
        content: "تفاصيل الوظيفة الطبية: المنشأة، الموقع، نطاق الراتب، المتطلبات، والتقديم المباشر.",
      },
      { property: "og:title", content: "تفاصيل الوظيفة | Job details | SyndeoCare" },
      { property: "og:description", content: "تعرّف على تفاصيل الوظيفة وقدّم عليها مباشرة." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobDetail,
  notFoundComponent: () => {
    const { lang } = useLang();
    const c = TXT[lang];
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">{c.notFoundTitle}</h1>
        <Button className="mt-6" asChild>
          <Link to="/jobs">{c.browseOther}</Link>
        </Button>
      </div>
    );
  },
});

function JobDetail() {
  const { lang } = useLang();
  const c = TXT[lang];
  const coverSchema = z.string().trim().max(2000, c.tooLong);
  const { jobId } = Route.useParams();
  const { user } = useSession();
  const { data: myFacility } = useMyFacility(user);
  const queryClient = useQueryClient();
  const [cover, setCover] = useState("");

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);

  const { data: job, isLoading, isError: jobErr, error: jobErrObj, refetch: jobRefetch } = useQuery({
    queryKey: ["job", jobId],
    queryFn: async () => {
      // Public browsing goes through the sanitized view (no publisher/owner data).
      const pub = publicJobsQuery();
      const { data: publicRow, error: publicError } = await (
        isUuid ? pub.eq("id", jobId) : pub.eq("slug", jobId)
      ).maybeSingle();
      if (publicError) throw publicError;
      if (publicRow) return { ...withSpecialty(publicRow), is_active: true };

      // Closed/expired listings stay reachable for the owner, admin, or engaged users
      // through the base table policy — with explicit columns only.
      const owned = supabase.from("jobs").select(OWNER_JOB_COLUMNS);
      const { data, error } = await (isUuid ? owned.eq("id", jobId) : owned.eq("slug", jobId))
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });


  const realJobId = job?.id;
  const isOwner = !!myFacility && !!job && job.facility_id === myFacility.id;

  const { data: revealedFacility } = useQuery({
    queryKey: ["revealed-facility", job?.facility_id, user?.id],
    enabled: !!user && !!job?.facility_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("id,name_ar,name_en,city,country,is_verified")
        .eq("id", job!.facility_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });


  const { data: existing } = useQuery({
    queryKey: ["application", realJobId, user?.id],
    enabled: !!user && !!realJobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status")
        .eq("job_id", realJobId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: saved } = useQuery({
    queryKey: ["saved-job", realJobId, user?.id],
    enabled: !!user && !!realJobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("job_id", realJobId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (saved) {
        const { error } = await supabase.from("saved_jobs").delete().eq("id", saved.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("saved_jobs")
        .insert({ job_id: realJobId!, user_id: user!.id });
      if (error) throw error;
      return true;
    },
    onSuccess: (added) => {
      toastUndo(
        added ? c.savedToast : c.removedToast,
        () => toggleSave.mutate(),
        lang,
      );
      queryClient.invalidateQueries({ queryKey: ["saved-job", realJobId] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
    },
    onError: () => toast.error(c.saveFailed),
  });

  const apply = useMutation({
    mutationFn: async () => {
      const parsed = coverSchema.safeParse(cover);
      if (!parsed.success) throw new Error("SC_" + parsed.error.issues[0]!.message);
      const args: { _job_id: string; _cover_letter?: string } = { _job_id: realJobId! };
      if (parsed.data) args._cover_letter = parsed.data;
      const { error } = await supabase.rpc("submit_job_application", args);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.appliedToast);
      queryClient.invalidateQueries({ queryKey: ["application", realJobId] });
    },
    onError: (e: Error) =>
      toast.error(
        e.message.startsWith("SC_") ? e.message.slice(3) : engagementErrorText(e.message, lang),
      ),
  });

  if (jobErr)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <ErrorState error={jobErrObj} onRetry={() => void jobRefetch()} />
      </div>
    );

  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  if (!job) return null;

  const specialty = specialtyName(job.specialties, lang);
  const expired = !!job.expires_at && new Date(job.expires_at).getTime() < Date.now();
  const isOpen = job.is_active && !expired;

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-on-hero/70">
            <Link to="/" className="hover:text-on-hero">{c.home}</Link>
            <span>/</span>
            <Link to="/jobs" className="hover:text-on-hero">{c.jobsCrumb}</Link>
            <span>/</span>
            <span className="text-on-hero">{job.title}</span>
          </nav>
          <Button variant="ghost" size="sm" asChild className="mt-3 text-on-hero/80 hover:bg-white/10 hover:text-on-hero">
            <Link to="/jobs">
              <ArrowLeft className="size-4 rtl:rotate-180" /> {c.back}
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">{job.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-on-hero/85">
            <Badge className={isOpen ? "bg-success text-on-hero" : "bg-muted text-foreground"}>
              {isOpen ? c.open : c.closed}
            </Badge>
            <span className="flex items-center gap-2">
              <Building2 className="size-4" /> {revealedFacility?.name_ar ?? c.hiddenEmployer}
            </span>

            {job.facility_verified && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="size-3" /> {c.verifiedEmployer}
              </Badge>
            )}
            {!!job.applications_count && (
              <Badge variant="outline" className="border-white/30 text-on-hero">
                {c.applications(job.applications_count)}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 pb-28 lg:pb-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main */}
          <div className="card-lift rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <MapPin className="size-3" /> {job.city}، {job.country}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Wallet className="size-3" /> {formatSalary(Number(job.salary_min), Number(job.salary_max), job.currency, lang)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <BriefcaseMedical className="size-3" /> {employmentLabel(job.employment_type, lang)}
              </Badge>
              {job.required_license && (
                <Badge variant="outline" className="gap-1">
                  <ShieldCheck className="size-3" /> {c.licenseBadge(job.required_license)}
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Clock className="size-3" /> {c.postedBadge(relativeTime(job.created_at, lang))}
              </Badge>
            </div>

            <h2 className="mt-8 text-lg font-bold">{c.description}</h2>
            <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">
              {job.description}
            </p>

            <h2 className="mt-6 text-lg font-bold">{c.requirements}</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              {job.min_experience > 0 && <li>{c.expReq(job.min_experience, specialty || c.defaultSpecialty)}</li>}
              {job.required_license && <li>{c.licenseReq(job.required_license)}</li>}
              <li>{c.teamworkReq}</li>
            </ul>

            <div className="mt-6 rounded-lg bg-surface p-4 text-sm text-muted-foreground">
              {revealedFacility ? c.revealedPrivacy : c.privacyNote}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-lift rounded-lg border border-border bg-card p-6">
              <div className="text-sm text-muted-foreground">{c.salaryLabel}</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-primary">
                {formatSalary(Number(job.salary_min), Number(job.salary_max), job.currency, lang)}
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{c.location}</span>
                  <span className="font-medium text-foreground">{job.city}، {job.country}</span>
                </div>
                <div className="flex justify-between">
                  <span>{c.employment}</span>
                  <span className="font-medium text-foreground">{employmentLabel(job.employment_type, lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{c.minExp}</span>
                  <span className="font-medium text-foreground">{experienceLabel(job.min_experience, lang)}</span>
                </div>
                {specialty && (
                  <div className="flex justify-between">
                    <span>{c.specialty}</span>
                    <span className="font-medium text-foreground">{specialty}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{c.vacancies}</span>
                  <span className="font-medium text-foreground">{job.vacancies ?? 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>{c.deadline}</span>
                  <span className="font-medium text-foreground">
                    {job.expires_at ? formatDate(job.expires_at, lang) : c.noDeadline}
                  </span>
                </div>
                {job.publisher_name && (
                  <div className="flex justify-between">
                    <span>{c.publishedBy}</span>
                    <span className="font-medium text-foreground">{job.publisher_name}</span>
                  </div>
                )}
              </div>
            </div>

            {isOwner ? (
              <OwnerListingPanel kind="job" listingId={job.id} facilityId={job.facility_id} />
            ) : (
            <div id="apply" className="card-lift scroll-mt-24 rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-bold">{c.applyTitle}</h2>
              {!user ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {c.signInPrompt}
                  </p>
                  <Button className="mt-4 w-full" asChild>
                    <Link to="/auth">{c.signInCta}</Link>
                  </Button>
                </>
              ) : existing ? (
                <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
                    <div>
                      <p className="font-bold text-success">{apply.isSuccess ? c.appliedNext : c.alreadyApplied}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{c.applyHint}</p>
                    </div>
                  </div>
                  <Button className="mt-4 w-full" variant="outline" asChild>
                    <Link to="/activity" search={{ tab: "applications" }}>{c.trackApplication}</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <label htmlFor="cover" className="mt-4 block text-sm font-medium">
                    {c.coverLabel} <span className="text-muted-foreground">({c.optional})</span>
                  </label>
                  <Textarea
                    id="cover"
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder={c.coverPlaceholder}
                    className="mt-1.5"
                    disabled={!isOpen}
                  />
                  <div className="mt-1 text-end text-xs text-muted-foreground">
                    {c.coverCount(cover.length)}
                  </div>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => apply.mutate()}
                    disabled={apply.isPending || !isOpen}
                  >
                    {apply.isPending && <Loader2 className="size-4 animate-spin" />}
                    {apply.isPending ? c.sending : isOpen ? c.sendApply : c.notAccepting}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">{c.applyHint}</p>
                </>
              )}
            </div>
            )}

            {user && !isOwner && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => toggleSave.mutate()}
                loading={toggleSave.isPending}
              >
                {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {saved ? c.saved : c.saveJob}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile apply bar */}
      {!isOwner && (
        <div className="fixed inset-x-0 bottom-[var(--app-bottom-nav)] z-40 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+var(--app-safe-bottom))] backdrop-blur lg:hidden">
           {existing ? (
             <Button className="w-full" asChild>
               <Link to="/activity" search={{ tab: "applications" }}>{c.trackApplication}</Link>
             </Button>
           ) : (
             <Button
               className="w-full"
               disabled={!isOpen}
               onClick={() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "center" })}
             >
               {isOpen ? c.applyTitle : c.notAccepting}
             </Button>
           )}
        </div>
      )}
    </>
  );
}
