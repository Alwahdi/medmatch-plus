import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, CalendarClock, MapPin, MessageSquare, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { ReviewDialog } from "@/components/review-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { applicationLabel, countryLabel, formatDate, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";

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
  },
} as const;

function CandidateProfile() {
  const { userId } = Route.useParams();
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();

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
        .select("*")
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/facility/candidates" className="text-sm text-primary underline underline-offset-4">
        {c.back}
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <RemoteAvatar
              value={pro.avatar_url}
              fallbackText={pro.full_name}
              className="size-16 rounded-2xl"
            />
            <div>
            <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold">
              {pro.full_name}
              {pro.is_verified && <ShieldCheck className="size-5 text-accent" />}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{pro.headline ?? ""}</p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Briefcase className="size-3.5" /> {c.experience(pro.years_experience)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {[pro.city, countryLabel(pro.country, lang)].filter(Boolean).join("، ")}
              </span>
              <RatingStars value={Number(pro.rating_avg ?? 0)} count={pro.rating_count ?? 0} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pro.is_verified && <Badge variant="secondary">{c.verified}</Badge>}
              {pro.is_open_to_shifts && <Badge variant="secondary">{c.openToShifts}</Badge>}
              {pro.license_number && (
                <Badge variant="outline">
                  {c.license}: {pro.license_number}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
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

        {pro.bio && (
          <div className="mt-6">
            <h2 className="text-sm font-bold">{c.about}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{pro.bio}</p>
          </div>
        )}
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
