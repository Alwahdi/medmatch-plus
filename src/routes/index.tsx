import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Check,
  FileText,
  Minus,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobCard, type JobRow } from "@/components/job-card";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SyndeoCare | وظائف طبية ومناوبات فورية في العالم العربي" },
      {
        name: "description",
        content:
          "ابحث عن وظائف طبية دائمة أو احجز مناوبة فورية، ووثّق ترخيصك مرة واحدة. منصة SyndeoCare للكوادر الصحية والمنشآت في المنطقة العربية.",
      },
      { property: "og:title", content: "SyndeoCare | وظائف طبية ومناوبات فورية" },
      {
        property: "og:description",
        content: "وظائف دائمة، مناوبات فورية، توثيق تراخيص، وسيرة ذاتية متوافقة مع أنظمة الفرز.",
      },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: CalendarClock,
    title: "سوق المناوبات الفورية",
    text: "المنشأة تنشر مناوبة، والكادر المؤهل يحجزها خلال دقائق — بدون وسطاء ولا مكالمات.",
  },
  {
    icon: ShieldCheck,
    title: "ملف اعتماد موحّد",
    text: "ارفع ترخيصك وشهاداتك مرة واحدة، وتُراجع وتُوثّق لتستخدمها في كل تقديم.",
  },
  {
    icon: Wallet,
    title: "شفافية الأجر",
    text: "كل إعلان يعرض نطاق الراتب بوضوح. لا مفاوضات في الظلام.",
  },
  {
    icon: Sparkles,
    title: "مطابقة ذكية",
    text: "نسبة توافق لكل وظيفة محسوبة من تخصصك وخبرتك ودولتك وترخيصك.",
  },
  {
    icon: FileText,
    title: "سيرة ذاتية ATS",
    text: "مولّد سيرة طبية منظّمة تمر بأنظمة الفرز الإلكتروني في المستشفيات.",
  },
  {
    icon: BadgeCheck,
    title: "منشآت موثّقة",
    text: "كل منشأة تُراجع قبل النشر، فلا تتقدم إلا لجهة حقيقية.",
  },
];

const STEPS = [
  { n: "1", title: "أنشئ ملفك المهني", text: "تخصصك، خبرتك، ودولة ترخيصك — خمس دقائق فقط." },
  { n: "2", title: "وثّق ترخيصك مرة واحدة", text: "نراجع وثائقك، وتظهر للمنشآت كـ«كادر موثّق»." },
  { n: "3", title: "تقدّم أو احجز مناوبة", text: "طلب بنقرة، أو مناوبة محجوزة الليلة بأجر معلن." },
];

const COMPARE = [
  ["نطاق راتب معلن في كل إعلان", true],
  ["حجز مناوبة فورية بدون وسيط", true],
  ["توثيق التراخيص والشهادات", true],
  ["نسبة توافق محسوبة لكل وظيفة", true],
  ["مولّد سيرة ذاتية متوافق مع ATS", true],
  ["تتبّع مراحل الطلب حتى التعيين", true],
] as const;

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["home-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,facilities(name_ar,is_verified),specialties(name_ar)",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as unknown as JobRow[];
    },
  });

  const { data: specialties } = useQuery({
    queryKey: ["home-specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,name_ar").limit(12);
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const [jobsCount, shiftsCount, facilitiesCount] = await Promise.all([
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("shifts").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("facilities").select("*", { count: "exact", head: true }),
      ]);
      return {
        jobs: jobsCount.count ?? 0,
        shifts: shiftsCount.count ?? 0,
        facilities: facilitiesCount.count ?? 0,
      };
    },
  });

  function search(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/jobs" });
  }

  return (
    <>
      <section className="hero-surface relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge className="mb-5 border-0 bg-white/15 text-white hover:bg-white/20">
              أول منصة عربية تجمع الوظائف والمناوبات والتوثيق
            </Badge>
            <h1 className="font-display text-4xl leading-tight font-extrabold md:text-5xl">
              وظيفتك الطبية القادمة… أو مناوبة الليلة
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/85">
              SyndeoCare يربط الأطباء والتمريض والصيادلة والفنيين بالمستشفيات والعيادات في المنطقة
              العربية — بأجر معلن، وترخيص موثّق، ومطابقة ذكية.
            </p>

            <form
              onSubmit={search}
              className="mt-8 flex flex-col gap-2 rounded-2xl bg-white/12 p-2 backdrop-blur sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-background px-3">
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="التخصص أو المسمى الوظيفي"
                  maxLength={80}
                  className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-11 w-full rounded-xl border-0 bg-background sm:w-40">
                  <SelectValue placeholder="كل الدول" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary" className="h-11 rounded-xl px-6">
                ابحث
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" asChild className="border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Link to="/shifts">سوق المناوبات</Link>
              </Button>
              <Button size="sm" asChild className="border border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Link to="/for-facilities">أنا منشأة صحية</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              <Stat value={stats?.jobs} label="وظيفة متاحة" />
              <Stat value={stats?.shifts} label="مناوبة مفتوحة" />
              <Stat value={stats?.facilities} label="منشأة صحية" />
            </dl>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="طبيبة وممرض في ممر مستشفى حديث"
              width={1600}
              height={1104}
              className="rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {specialties && specialties.length > 0 && (
        <section className="border-b border-border bg-background py-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4">
            <span className="ms-2 text-sm font-medium text-muted-foreground">تخصصات مطلوبة:</span>
            {specialties.slice(0, 10).map((s) => (
              <Link
                key={s.id}
                to="/jobs"
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {s.name_ar}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-extrabold">لماذا SyndeoCare؟</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            لوحات الوظائف التقليدية تنشر إعلاناً وتتركك. نحن نغطي الرحلة كاملة: من توثيق ترخيصك حتى
            أول يوم عمل.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-lift rounded-2xl border border-border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-extrabold">كيف تبدأ خلال 3 خطوات</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent/12 font-display text-lg font-extrabold text-accent">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="font-display text-3xl font-extrabold">SyndeoCare مقابل لوحة وظائف عادية</h2>
          <p className="mt-3 text-muted-foreground">
            الفرق ليس في عدد الإعلانات، بل في ما يحدث بعد الضغط على «تقديم».
          </p>
          <div className="card-lift mt-8 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border bg-surface px-5 py-3 text-xs font-bold">
              <span>الميزة</span>
              <span className="w-24 text-center text-primary">SyndeoCare</span>
              <span className="w-24 text-center text-muted-foreground">لوحة عادية</span>
            </div>
            {COMPARE.map(([label]) => (
              <div
                key={label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border px-5 py-3.5 text-sm last:border-0"
              >
                <span>{label}</span>
                <span className="flex w-24 justify-center">
                  <Check className="size-4 text-accent" />
                </span>
                <span className="flex w-24 justify-center">
                  <Minus className="size-4 text-muted-foreground" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-extrabold">أحدث الوظائف</h2>
              <p className="mt-2 text-muted-foreground">فرص منشورة من منشآت موثّقة.</p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/jobs">
                عرض الكل <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobsLoading
              ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)
              : jobs?.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      </section>

      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="font-display text-3xl font-extrabold">ابدأ خلال دقيقتين</h2>
          <p className="max-w-xl text-primary-foreground/85">
            سجّل كادراً صحياً وابدأ التقديم، أو سجّل منشأتك وانشر أول وظيفة أو مناوبة مجاناً.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                إنشاء حساب كادر صحي
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <Link to="/for-facilities">أنا منشأة صحية</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div>
      <dt className="font-display text-3xl font-extrabold">{value ?? "—"}</dt>
      <dd className="text-xs text-white/75">{label}</dd>
    </div>
  );
}
