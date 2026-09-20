import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Clock,
  MapPin,
  ShieldCheck,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/confirm-dialog";
import { engagementErrorText } from "@/lib/engagement-errors";
import { supabase } from "@/integrations/supabase/client";
import { publicShiftsQuery, toPublicShift, OWNER_SHIFT_COLUMNS } from "@/lib/public-listings";
import { useMyFacility, useSession } from "@/lib/auth";
import { OwnerListingPanel } from "@/components/owner-listing-panel";
import {
  countryLabel,
  facilityDisplayName,
  formatDateTime,
  formatMoney,
  hoursBetween,
  specialtyName,
} from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { ErrorState } from "@/components/error-state";
import { ReportButton } from "@/components/report-dialog";
import { canonical, shareMeta, fetchPublicShiftMeta, shiftSeoText, NOINDEX } from "@/lib/seo";

const TXT = {
  ar: {
    notFoundTitle: "هذه المناوبة لم تعد متاحة",
    browseOther: "تصفح مناوبات أخرى",
    home: "الرئيسية",
    crumb: "المناوبات",
    back: "العودة للمناوبات",
    open: "متاحة للحجز",
    booked: "محجوزة",
    cancelled: "ملغاة",
    completed: "منتهية",
    urgent: "مستعجلة",
    verified: "ناشر موثّق",
    hiddenEmployer: "اسم المنشأة محجوب حتى تحجز المناوبة أو يبدأ التواصل معك",
    facilityProfile: "ملف المنشأة",
    details: "تفاصيل المناوبة",
    notes: "ملاحظات الناشر",
    noNotes: "لا توجد ملاحظات إضافية.",
    start: "البداية",
    end: "النهاية",
    duration: "المدة",
    hours: (n: number) => `${n} ساعة`,
    rate: "الأجر بالساعة",
    location: "الموقع",
    specialty: "التخصص",
    applied: (n: number) => `${n} طلب حجز`,
    totalLabel: "إجمالي أجر المناوبة",
    bookTitle: "حجز المناوبة",
    signInPrompt: "سجّل دخولك لحجز المناوبة ومتابعة جدولك.",
    signIn: "تسجيل الدخول للحجز",
    book: "احجز المناوبة",
    alreadyBooked: "لقد حجزت هذه المناوبة — تابعها من",
    myShifts: "صفحة مناوباتي",
    unavailable: "غير متاحة للحجز",
    confirmTitle: "تأكيد حجز المناوبة",
    confirmDesc: (d: string, h: number) =>
      `ستلتزم بالحضور يوم ${d} لمدة ${h} ساعة. يمكنك الإلغاء لاحقاً من صفحة مناوباتي.`,
    confirmCta: "نعم، احجزها",
    bookedToast: "تم حجز المناوبة — ستجدها في صفحة مناوباتي",
    failed: "تعذّر الحجز، ربما حُجزت المناوبة للتو",
    hint: "الحجز مجاني للكوادر الصحية. بعد نجاح الحجز يمكن للمنشأة التواصل معك للتنسيق حول التفاصيل.",
    bookedNext: "تم الحجز. راجع الموعد وأي مقابلة أو تحديث من نشاطك.",
    trackBooking: "متابعة الحجز",
  },
  en: {
    notFoundTitle: "This shift is no longer available",
    browseOther: "Browse other shifts",
    home: "Home",
    crumb: "Shifts",
    back: "Back to shifts",
    open: "Open for booking",
    booked: "Booked",
    cancelled: "Cancelled",
    completed: "Completed",
    urgent: "Urgent",
    verified: "Verified employer",
    hiddenEmployer: "Employer name is hidden until you book the shift or contact begins",
    facilityProfile: "Employer profile",
    details: "Shift details",
    notes: "Employer notes",
    noNotes: "No additional notes.",
    start: "Start",
    end: "End",
    duration: "Duration",
    hours: (n: number) => `${n} hours`,
    rate: "Hourly rate",
    location: "Location",
    specialty: "Specialty",
    applied: (n: number) => `${n} booking requests`,
    totalLabel: "Total shift pay",
    bookTitle: "Book this shift",
    signInPrompt: "Sign in to book this shift and track your schedule.",
    signIn: "Sign in to book",
    book: "Book this shift",
    alreadyBooked: "You already booked this shift — track it from",
    myShifts: "My shifts",
    unavailable: "Not available for booking",
    confirmTitle: "Confirm shift booking",
    confirmDesc: (d: string, h: number) =>
      `You are committing to attend on ${d} for ${h} hours. You can cancel later from My shifts.`,
    confirmCta: "Yes, book it",
    bookedToast: "Shift booked — you'll find it under My shifts",
    failed: "Booking failed, the shift may have just been taken",
    hint: "Booking is free for healthcare professionals. After booking, the facility can contact you to coordinate details.",
    bookedNext: "Booked successfully. Review the schedule and any updates from your activity.",
    trackBooking: "Track booking",
  },
} as const;

export const Route = createFileRoute("/_public/shifts/$shiftId")({
  // البيانات الوصفية من العرض المنقّح فقط؛ المناوبة المحجوزة أو المنتهية لا تُفهرس.
  loader: async ({ params }) => {
    const meta = await fetchPublicShiftMeta(params.shiftId);
    return { seo: meta ? shiftSeoText(meta) : null };
  },
  head: ({ params, loaderData }) => {
    const path = `/shifts/${params.shiftId}`;
    const seo = loaderData?.seo;
    if (!seo)
      return {
        meta: [
          { title: "هذه المناوبة لم تعد متاحة | SyndeoCare" },
          { name: "description", content: "هذه المناوبة لم تعد متاحة للحجز. تصفّح المناوبات المتاحة حالياً على SyndeoCare." },
          { property: "og:title", content: "هذه المناوبة لم تعد متاحة | SyndeoCare" },
          { property: "og:description", content: "تصفّح المناوبات الطبية المتاحة حالياً على SyndeoCare." },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          NOINDEX,
          ...shareMeta("/jobs"),
        ],
        links: canonical("/jobs"),
      };
    return {
      meta: [
        { title: seo.title },
        { name: "description", content: seo.description },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        ...shareMeta(path),
      ],
      links: canonical(path),
    };
  },
  component: ShiftDetail,
  notFoundComponent: () => {
    const { lang } = useLang();
    const c = TXT[lang];
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">{c.notFoundTitle}</h1>
        <Button className="mt-6" asChild>
          <Link to="/jobs" search={{ kind: "shift" }}>{c.browseOther}</Link>
        </Button>
      </div>
    );
  },
});

function ShiftDetail() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { shiftId } = Route.useParams();
  const { user } = useSession();
  const { data: myFacility } = useMyFacility(user);
  const proGate = useProfessionalVerificationGate(myFacility ? undefined : user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();

  const { data: shift, isLoading, isError: shiftErr, error: shiftErrObj, refetch: shiftRefetch } = useQuery({
    queryKey: ["shift", shiftId],
    queryFn: async () => {
      // Public browsing goes through the sanitized view (no booked_by / owner data).
      const { data: publicRow, error: publicError } = await publicShiftsQuery()
        .eq("id", shiftId)
        .maybeSingle();
      if (publicError) throw publicError;
      if (publicRow) return toPublicShift(publicRow);

      // Booked/past shifts stay reachable for the owner, admin, or engaged users
      // through the base table policy — with explicit columns only.
      const { data, error } = await supabase
        .from("shifts")
        .select(OWNER_SHIFT_COLUMNS)
        .eq("id", shiftId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const isOwner = !!myFacility && !!shift && shift.facility_id === myFacility.id;

  const { data: facility } = useQuery({
    queryKey: ["revealed-facility", shift?.facility_id, user?.id],
    enabled: !!user && !!shift?.facility_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facilities")
        .select("id,name_ar,name_en,city,country,is_verified")
        .eq("id", shift!.facility_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: booking } = useQuery({
    queryKey: ["shift-booking", shiftId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_bookings")
        .select("id,status")
        .eq("shift_id", shiftId)
        .eq("user_id", user!.id)
        .eq("status", "confirmed")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("book_open_shift", { _shift_id: shiftId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.bookedToast);
      queryClient.invalidateQueries({ queryKey: ["shift", shiftId] });
      queryClient.invalidateQueries({ queryKey: ["shift-booking", shiftId] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
    },
    onError: (e: Error) => {
      toast.error(engagementErrorText(e.message, lang));
      queryClient.invalidateQueries({ queryKey: ["shift", shiftId] });
    },
  });

  if (shiftErr)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <ErrorState error={shiftErrObj} onRetry={() => void shiftRefetch()} />
      </div>
    );

  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  if (!shift) return null;

  const hours = hoursBetween(shift.starts_at, shift.ends_at);
  const total = hours * Number(shift.hourly_rate);
  const isOpen = shift.status === "open" && new Date(shift.starts_at).getTime() > Date.now();
  const statusLabel =
    shift.status === "open"
      ? c.open
      : shift.status === "booked"
        ? c.booked
        : shift.status === "cancelled"
          ? c.cancelled
          : c.completed;

  async function onBook() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    const ok = await confirm({
      title: c.confirmTitle,
      description: c.confirmDesc(formatDateTime(shift!.starts_at, lang), hours),
      confirmLabel: c.confirmCta,
    });
    if (ok) book.mutate();
  }

  return (
    <>
      {confirmDialog}
      <section className="page-hero py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-primary-foreground/70">
            <Link to="/" className="hover:text-primary-foreground">
              {c.home}
            </Link>
            <span>/</span>
            <Link to="/jobs" search={{ kind: "shift" }} className="hover:text-primary-foreground">
              {c.crumb}
            </Link>
            <span>/</span>
            <span className="text-primary-foreground">{shift.title}</span>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mt-3 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/jobs" search={{ kind: "shift" }}>
              <ArrowLeft className="size-4 rtl:rotate-180" /> {c.back}
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">{shift.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-primary-foreground/85">
            <Badge className={isOpen ? "bg-success text-success-foreground" : "bg-muted text-foreground"}>
              {statusLabel}
            </Badge>
            {shift.is_urgent && isOpen && (
              <Badge className="bg-warning text-warning-foreground">{c.urgent}</Badge>
            )}
            <span className="flex items-center gap-2">
              <Building2 className="size-4" />
              {facility ? (
                <Link
                  to="/facilities/$facilityId"
                  params={{ facilityId: facility.id }}
                  className="underline"
                >
                  {facilityDisplayName(facility, lang)}
                </Link>
              ) : (
                c.hiddenEmployer
              )}
            </span>
            {shift.facility_verified && (
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="size-3" /> {c.verified}
              </Badge>
            )}
            {!!shift.applications_count && (
              <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground">
                {c.applied(shift.applications_count)}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 pb-28 lg:pb-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="card-lift rounded-lg border border-border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="gap-1">
                <MapPin className="size-3" /> {shift.city}، {countryLabel(shift.country, lang)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Timer className="size-3" /> {c.hours(hours)}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Wallet className="size-3" />{" "}
                {formatMoney(Number(shift.hourly_rate), shift.currency, lang)}
              </Badge>
              {shift.specialties && (
                <Badge variant="outline" className="gap-1">
                  <CalendarClock className="size-3" /> {specialtyName(shift.specialties, lang)}
                </Badge>
              )}
            </div>

            <h2 className="mt-8 text-lg font-bold">{c.details}</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row icon={Clock} label={c.start} value={formatDateTime(shift.starts_at, lang)} />
              <Row icon={Clock} label={c.end} value={formatDateTime(shift.ends_at, lang)} />
              <Row icon={Timer} label={c.duration} value={c.hours(hours)} />
              <Row
                icon={MapPin}
                label={c.location}
                value={`${shift.city}، ${countryLabel(shift.country, lang)}`}
              />
              {shift.specialties && (
                <Row
                  icon={Users}
                  label={c.specialty}
                  value={specialtyName(shift.specialties, lang)}
                />
              )}
            </div>

            <h2 className="mt-8 text-lg font-bold">{c.notes}</h2>
            <p className="mt-2 leading-relaxed whitespace-pre-line text-muted-foreground">
              {shift.notes || c.noNotes}
            </p>

            <div className="mt-6 border-t border-border pt-4">
              <ReportButton
                targetType="shift"
                targetId={shift.id}
                className="px-0 text-muted-foreground hover:text-foreground"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-lift rounded-lg border border-border bg-card p-4 sm:p-6">
              <div className="text-sm text-muted-foreground">{c.totalLabel}</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-accent">
                {formatMoney(total, shift.currency, lang)}
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{c.rate}</span>
                  <span className="font-medium text-foreground">
                    {formatMoney(Number(shift.hourly_rate), shift.currency, lang)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{c.duration}</span>
                  <span className="font-medium text-foreground">{c.hours(hours)}</span>
                </div>
              </div>
            </div>

            {isOwner ? (
              <OwnerListingPanel
                kind="shift"
                listingId={shift.id}
                facilityId={shift.facility_id}
                completed={shift.status === "completed"}
              />
            ) : (
            <div id="book" className="card-lift scroll-mt-24 rounded-lg border border-border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-bold">{c.bookTitle}</h2>
              {!user ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">{c.signInPrompt}</p>
                  <Button className="mt-4 w-full" asChild>
                    <Link to="/auth">{c.signIn}</Link>
                  </Button>
                </>
              ) : proGate.blocked ? (
                <VerificationGateNotice hasProfile={proGate.hasProfile} />
              ) : booking ? (
                <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" />
                    <div>
                      <p className="font-bold text-success">{book.isSuccess ? c.bookedNext : c.alreadyBooked}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{c.hint}</p>
                    </div>
                  </div>
                  <Button className="mt-4 w-full" variant="outline" asChild>
                    <Link to="/activity" search={{ tab: "shifts" }}>{c.trackBooking}</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    className="mt-4 w-full"
                    onClick={onBook}
                    disabled={!isOpen || book.isPending}
                  >
                    {isOpen ? c.book : c.unavailable}
                  </Button>
                  <p className="mt-2 text-xs text-muted-foreground">{c.hint}</p>
                </>
              )}
            </div>
            )}

            {facility && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/facilities/$facilityId" params={{ facilityId: facility.id }}>
                  <Building2 className="size-4" /> {c.facilityProfile}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky mobile book bar */}
      {!isOwner && (
        <div className="fixed inset-x-0 bottom-[var(--app-bottom-nav)] z-40 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+var(--app-safe-bottom))] backdrop-blur lg:hidden">
           {booking ? (
             <Button className="w-full" asChild>
               <Link to="/activity" search={{ tab: "shifts" }}>{c.trackBooking}</Link>
             </Button>
           ) : (
             <Button
               className="w-full"
               disabled={!isOpen || book.isPending}
               loading={book.isPending}
               onClick={onBook}
             >
               {isOpen ? c.book : c.unavailable}
             </Button>
           )}
        </div>
      )}
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
