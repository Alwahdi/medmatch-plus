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
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import {
  countryLabel,
  formatDateTime,
  formatMoney,
  hoursBetween,
  specialtyName,
} from "@/lib/format";
import { useLang } from "@/lib/i18n";

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
    hiddenEmployer: "اسم المنشأة محجوب حتى يبدأ التواصل أو يُقبل حجزك",
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
    hint: "الحجز مجاني للكوادر الصحية، وسيتواصل معك الناشر لتأكيد التفاصيل.",
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
    hiddenEmployer: "Employer name is hidden until contact starts or your booking is accepted",
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
    hint: "Booking is free for healthcare professionals; the employer will contact you to confirm details.",
  },
} as const;

export const Route = createFileRoute("/_public/shifts/$shiftId")({
  head: () => ({
    meta: [
      { title: "تفاصيل المناوبة | SyndeoCare" },
      {
        name: "description",
        content: "تفاصيل المناوبة الطبية: التوقيت، المدة، الأجر بالساعة، الموقع، والحجز المباشر.",
      },
      { property: "og:title", content: "تفاصيل المناوبة | SyndeoCare" },
      { property: "og:description", content: "اطّلع على تفاصيل المناوبة واحجزها مباشرة." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShiftDetail,
  notFoundComponent: () => {
    const { lang } = useLang();
    const c = TXT[lang];
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">{c.notFoundTitle}</h1>
        <Button className="mt-6" asChild>
          <Link to="/shifts">{c.browseOther}</Link>
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();

  const { data: shift, isLoading } = useQuery({
    queryKey: ["shift", shiftId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*,specialties(name_ar,name_en)")
        .eq("id", shiftId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: facility } = useQuery({
    queryKey: ["revealed-facility", shift?.facility_id, user?.id],
    enabled: !!user && !!shift?.facility_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("facilities")
        .select("id,name_ar,name_en,city,country,is_verified")
        .eq("id", shift!.facility_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: booking } = useQuery({
    queryKey: ["shift-booking", shiftId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_bookings")
        .select("id,status")
        .eq("shift_id", shiftId)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("shift_bookings")
        .insert({ shift_id: shiftId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.bookedToast);
      queryClient.invalidateQueries({ queryKey: ["shift", shiftId] });
      queryClient.invalidateQueries({ queryKey: ["shift-booking", shiftId] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      queryClient.invalidateQueries({ queryKey: ["my-shifts"] });
    },
    onError: () => {
      toast.error(c.failed);
      queryClient.invalidateQueries({ queryKey: ["shift", shiftId] });
    },
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  if (!shift) return null;

  const hours = hoursBetween(shift.starts_at, shift.ends_at);
  const total = hours * Number(shift.hourly_rate);
  const isOpen = shift.status === "open";
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
          <nav className="flex flex-wrap items-center gap-2 text-xs text-white/70">
            <Link to="/" className="hover:text-white">
              {c.home}
            </Link>
            <span>/</span>
            <Link to="/shifts" className="hover:text-white">
              {c.crumb}
            </Link>
            <span>/</span>
            <span className="text-white">{shift.title}</span>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mt-3 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Link to="/shifts">
              <ArrowLeft className="size-4" /> {c.back}
            </Link>
          </Button>
          <h1 className="mt-4 font-display text-3xl font-extrabold md:text-4xl">{shift.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-white/85">
            <Badge className={isOpen ? "bg-success text-white" : "bg-muted text-foreground"}>
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
                  {facility.name_ar}
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
              <Badge variant="outline" className="border-white/30 text-white">
                {c.applied(shift.applications_count)}
              </Badge>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 pb-28 lg:pb-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="card-lift rounded-2xl border border-border bg-card p-4 sm:p-6">
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
          </div>

          <div className="space-y-6">
            <div className="card-lift rounded-2xl border border-border bg-card p-4 sm:p-6">
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

            <div id="book" className="card-lift scroll-mt-24 rounded-2xl border border-border bg-card p-4 sm:p-6">
              <h2 className="text-lg font-bold">{c.bookTitle}</h2>
              {!user ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">{c.signInPrompt}</p>
                  <Button className="mt-4 w-full" asChild>
                    <Link to="/auth">{c.signIn}</Link>
                  </Button>
                </>
              ) : booking ? (
                <p className="mt-2 text-sm text-success">
                  {c.alreadyBooked}{" "}
                  <Link to="/my-shifts" className="underline">
                    {c.myShifts}
                  </Link>
                  .
                </p>
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
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <Button
          className="w-full"
          disabled={!isOpen}
          onClick={() => document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "center" })}
        >
          {isOpen ? (booking ? c.alreadyBooked : c.bookTitle) : c.unavailable}
        </Button>
      </div>
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
