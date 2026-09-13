import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  Banknote,
  Briefcase,
  CalendarClock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { RemoteAvatar } from "@/components/remote-avatar";

import { ReviewDialog } from "@/components/review-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { applicationLabel, countryLabel, formatDate, formatMoney, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { OnlineDotClass, useOnlineUsers } from "@/lib/presence";

export const Route = createFileRoute("/_authenticated/facility/candidates/$userId")({
  head: () => ({
    meta: [
      { title: "ملف المرشح | SyndeoCare" },
      { name: "description", content: "ملف الكادر الصحي الكامل: الخبرة، التخصص، التقييمات وسجل التعامل مع منشأتك." },
      { property: "og:title", content: "ملف المرشح | SyndeoCare" },
      { property: "og:description", content: "ملف كادر صحي داخل SyndeoCare." },
    ],
  }),
  component: CandidateProfile,
});

const TXT = {
  ar: {
    loading: "جارٍ التحميل...",
    notFound: "لا يمكن عرض هذا الملف",
    notFoundBody: "يظهر الملف الكامل بعد أن يتقدّم المرشح لإحدى وظائفك أو يحجز إحدى مناوباتك.",
    back: "رجوع",
    verified: "موثّق",
    openToShifts: "متاح للمناوبات",
    experience: (n: number) => `خبرة ${n} سنة`,
    about: "نبذة",
    history: "سجل التعامل مع منشأتك",
    applications: "الطلبات",
    shifts: "المناوبات",
    none: "لا يوجد سجل بعد.",
    reviews: "تقييمات الكوادر",
    noReviews: "لا توجد تقييمات بعد.",
    message: "مراسلة",
    chatOpened: "تم فتح المحادثة",
    chatFailed: "تعذّر بدء المحادثة",
    noFacility: "أكمل بيانات المنشأة أولاً",
    expected: "الراتب المتوقع",
    license: "الترخيص",
    online: "متصل الآن",
    offline: "غير متصل",
    memberSince: "عضو منذ",
  },
  en: {
    loading: "Loading...",
    notFound: "This profile isn't available",
    notFoundBody: "Full profiles appear after the candidate applies to one of your jobs or books one of your shifts.",
    back: "Back",
    verified: "Verified",
    openToShifts: "Open to shifts",
    experience: (n: number) => `${n} years experience`,
    about: "About",
    history: "History with your facility",
    applications: "Applications",
    shifts: "Shifts",
    none: "No history yet.",
    reviews: "Reviews",
    noReviews: "No reviews yet.",
    message: "Message",
    chatOpened: "Conversation opened",
    chatFailed: "Failed to start conversation",
    noFacility: "Complete your facility profile first",
    expected: "Expected salary",
    license: "License",
    online: "Online now",
    offline: "Offline",
    memberSince: "Member since",
  },
} as const;

function CandidateProfile() {
  const { userId } = Route.useParams();
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const online = useOnlineUsers(user);

  const { data, isLoading } = useQuery({
    queryKey: ["candidate-profile", userId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: facility } = await supabase
        .from("facilities")
        .select("id,name_ar")
        .eq("user_id", user!.id)
        .maybeSingle();
      const { data: pro } = await supabase
        .from("healthcare_professionals")
        .select("*, specialty:specialty_id(name_ar,name_en)")
        .eq("user_id", userId)
        .maybeSingle();
      if (!pro) return { pro: null, facility, apps: [], bookings: [], reviews: [] };

      const [{ data: jobs }, { data: shifts }] = await Promise.all([
        supabase.from("jobs").select("id,title").eq("facility_id", facility?.id ?? ""),
        supabase.from("shifts").select("id,title,starts_at").eq("facility_id", facility?.id ?? ""),
      ]);
      const jobIds = (jobs ?? []).map((j) => j.id);
      const shiftIds = (shifts ?? []).map((s) => s.id);

      const [{ data: apps }, { data: bookings }, { data: reviews }] = await Promise.all([
        jobIds.length
          ? supabase
              .from("applications")
              .select("id,status,created_at,job_id")
              .eq("user_id", userId)
              .in("job_id", jobIds)
          : Promise.resolve({ data: [] as never[] }),
        shiftIds.length
          ? supabase
              .from("shift_bookings")
              .select("id,status,created_at,shift_id")
              .eq("user_id", userId)
              .in("shift_id", shiftIds)
          : Promise.resolve({ data: [] as never[] }),
        supabase
          .from("reviews")
          .select("id,rating,comment,created_at")
          .eq("direction", "facility_to_pro")
          .eq("professional_user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      return {
        pro,
        facility,
        apps: (apps ?? []).map((a) => ({ ...a, title: jobs?.find((j) => j.id === a.job_id)?.title ?? "" })),
        bookings: (bookings ?? []).map((b) => ({
          ...b,
          shift: shifts?.find((s) => s.id === b.shift_id) ?? null,
        })),
        reviews: reviews ?? [],
      };
    },
  });

  const startChat = useMutation({
    mutationFn: async () => {
      if (!data?.facility) throw new Error("no-facility");
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("facility_id", data.facility.id)
        .eq("professional_user_id", userId)
        .maybeSingle();
      if (existing) return;
      const { error } = await supabase
        .from("conversations")
        .insert({ facility_id: data.facility.id, professional_user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.chatOpened);
      navigate({ to: "/messages" });
    },
    onError: (e: Error) => toast.error(e.message === "no-facility" ? c.noFacility : c.chatFailed),
  });

  if (isLoading) return <p className="p-10 text-center text-muted-foreground">{c.loading}</p>;

  if (!data?.pro)
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-extrabold">{c.notFound}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{c.notFoundBody}</p>
        <Link to="/facility/candidates" className="mt-6 inline-block text-primary underline underline-offset-4">
          {c.back}
        </Link>
      </div>
    );

  const pro = data.pro;
  const hired = data.apps.some((a) => a.status === "hired");
  const confirmed = data.bookings.some((b) => b.status === "confirmed");
  const isOnline = online.has(userId);
  const specialty = (pro as { specialty?: { name_ar: string; name_en: string } | null }).specialty;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/facility/candidates" className="text-sm text-primary underline underline-offset-4">
        {c.back}
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-24 bg-gradient-to-l from-primary/25 via-accent/15 to-primary/5" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <RemoteAvatar
                  value={pro.avatar_url}
                  fallbackText={pro.full_name}
                  className="size-24 rounded-2xl ring-4 ring-card"
                />
                <span
                  className={`absolute -bottom-1 -end-1 size-5 rounded-full border-4 border-card ${OnlineDotClass(isOnline)}`}
                  title={isOnline ? c.online : c.offline}
                />
              </div>
              <div className="pb-1">
                <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold">
                  {pro.full_name}
                  {pro.is_verified && <ShieldCheck className="size-5 text-accent" />}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">{pro.headline ?? ""}</p>
                <p className={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${isOnline ? "text-emerald-600" : "text-muted-foreground"}`}>
                  <span className={`size-2 rounded-full ${OnlineDotClass(isOnline)}`} />
                  {isOnline ? c.online : c.offline}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-1">
              <Button size="sm" onClick={() => startChat.mutate()} disabled={startChat.isPending}>
                <MessageSquare className="size-4" /> {c.message}
              </Button>
              {(hired || confirmed) && user && data.facility && (
                <ReviewDialog
                  direction="facility_to_pro"
                  facilityId={data.facility.id}
                  professionalUserId={userId}
                  authorUserId={user.id}
                  targetName={pro.full_name}
                />
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {specialty && (
              <Badge variant="secondary" className="gap-1">
                <Stethoscope className="size-3" />
                {lang === "en" ? specialty.name_en : specialty.name_ar}
              </Badge>
            )}
            {pro.is_verified && (
              <Badge variant="secondary" className="gap-1">
                <BadgeCheck className="size-3" /> {c.verified}
              </Badge>
            )}
            {pro.is_open_to_shifts && <Badge variant="secondary">{c.openToShifts}</Badge>}
            {pro.license_number && (
              <Badge variant="outline">
                {c.license}: {pro.license_number}
              </Badge>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-surface p-3 text-center">
              <Briefcase className="mx-auto size-4 text-primary" />
              <p className="mt-1 text-sm font-bold">{pro.years_experience}</p>
              <p className="text-[11px] text-muted-foreground">{c.experience(pro.years_experience)}</p>
            </div>
            <div className="rounded-xl bg-surface p-3 text-center">
              <MapPin className="mx-auto size-4 text-primary" />
              <p className="mt-1 text-sm font-bold">{pro.city ?? "—"}</p>
              <p className="text-[11px] text-muted-foreground">{countryLabel(pro.country, lang)}</p>
            </div>
            <div className="rounded-xl bg-surface p-3 text-center">
              <Banknote className="mx-auto size-4 text-primary" />
              <p className="mt-1 text-sm font-bold">
                {pro.expected_salary ? formatMoney(Number(pro.expected_salary), pro.currency ?? "YER", lang) : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">{c.expected}</p>
            </div>
            <div className="rounded-xl bg-surface p-3 text-center">
              <div className="flex justify-center">
                <RatingStars value={Number(pro.rating_avg ?? 0)} />
              </div>
              <p className="mt-1 text-sm font-bold">{pro.rating_count ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{c.reviews}</p>
            </div>
          </div>

          {pro.bio && (
            <div className="mt-6">
              <h2 className="text-sm font-bold">{c.about}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{pro.bio}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">{c.history}</h2>
        {data.apps.length === 0 && data.bookings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{c.none}</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{c.applications}</p>
              <ul className="mt-2 space-y-2">
                {data.apps.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{a.title}</span>
                    <Badge variant="secondary">{applicationLabel(a.status, lang)}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">{c.shifts}</p>
              <ul className="mt-2 space-y-2">
                {data.bookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 truncate">
                      <CalendarClock className="size-3.5 text-muted-foreground" />
                      {b.shift?.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {b.shift ? formatDate(b.shift.starts_at, lang) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-bold">{c.reviews}</h2>
        {data.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{c.noReviews}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {data.reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <RatingStars value={r.rating} />
                  <span className="text-xs text-muted-foreground">{relativeTime(r.created_at, lang)}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
