import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Building2,
  FileUp,
  Gift,
  Globe2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import forProsImage from "@/assets/for-professionals.jpg";
import forEmployersImage from "@/assets/for-employers.jpg";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { JobCard, type JobRow } from "@/components/job-card";
import { ShiftCard, type ShiftRow } from "@/components/shift-card";
import { supabase } from "@/integrations/supabase/client";
import { GUIDES } from "@/content/guides";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SyndeoCare | وظائف وشيفتات طبية موثوقة في العالم العربي" },
      {
        name: "description",
        content:
          "كل الكفاءات الطبية التي تحتاجها — أطباء، صيادلة، تمريض، وفنيون — في مكان واحد. وظائف دائمة، شيفتات فورية، وناشرو وظائف موثّقون.",
      },
      { property: "og:title", content: "SyndeoCare | نبني مستقبل التوظيف الطبي" },
      {
        property: "og:description",
        content: "وظائف دائمة وشيفتات فورية لدى ناشري وظائف طبية موثّقين، مجاناً للباحثين عن عمل.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const WHY = [
  {
    icon: ShieldCheck,
    title: "ناشرو الوظائف موثّقون",
    text: "كل مستشفى وعيادة ومعمل وصيدلية تم التحقق من اعتماداتها قبل النشر.",
  },
  {
    icon: Zap,
    title: "قدّم بنقرة واحدة",
    text: "أرسل ملفك الطبي فوراً — بدون نماذج طويلة ولا خطابات تعريف.",
  },
  {
    icon: Globe2,
    title: "مصمّم للمنطقة العربية",
    text: "مبنيّ لأسواق الرعاية الصحية في السعودية والإمارات ومصر وباقي دول الخليج.",
  },
  {
    icon: Gift,
    title: "مجانية للباحثين عن عمل",
    text: "بدون رسوم أبداً — للأطباء والتمريض والصيادلة والفنيين.",
  },
];

const EMPLOYER_STEPS = [
  {
    title: "انشر وظيفة أو شيفت",
    text: "انشر وظيفة دائمة أو شيفتاً عاجلاً خلال دقائق — ليظهر فوراً للكوادر الموثّقة.",
  },
  {
    title: "استقبل الطلبات",
    text: "الكوادر المؤهّلة، بعد تدقيق تراخيصها، تبدأ بالتقديم خلال دقائق من النشر.",
  },
  {
    title: "تنبيهات فورية عند كل طلب",
    text: "يصلك تنبيه لحظة تقدّم أي مرشّح — دون الحاجة لمتابعة لوحة التحكم.",
    highlight: "ميزة SyndeoCare",
  },
  {
    title: "راجع المرشحين ووظّف",
    text: "افتح الطلب مباشرة، قارن الملفات، راسل المرشّح، وأكّد التعيين.",
  },
];

const SEEKER_STEPS = [
  {
    title: "ارفع سيرتك الذاتية",
    text: "يبني الذكاء الاصطناعي ملفك المهني في ثوانٍ بدل ملء النماذج الطويلة.",
  },
  {
    title: "وثّق ترخيصك مرة واحدة",
    text: "ارفع الترخيص والشهادات، ونراجعها لتظهر كـ«كادر موثّق» في كل تقديم.",
    highlight: "ميزة SyndeoCare",
  },
  {
    title: "تصفّح وقدّم بنقرة",
    text: "وظائف دائمة وشيفتات فورية بأجر معلن لدى ناشري وظائف موثّقين.",
  },
  {
    title: "تابع طلبك حتى التعيين",
    text: "تتبّع مراحل الطلب وراسل جهة التوظيف مباشرة من داخل المنصة.",
  },
];

function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [tab, setTab] = useState<"employers" | "seekers">("employers");

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["home-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id,title,country,city,salary_min,salary_max,currency,employment_type,min_experience,created_at,expires_at,is_featured,facility_verified,applications_count,specialties(name_ar)",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as unknown as JobRow[];
    },
  });

  const { data: shifts, isLoading: shiftsLoading } = useQuery({
    queryKey: ["home-shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select(
          "id,title,notes,starts_at,ends_at,hourly_rate,currency,country,city,status,is_urgent,facility_verified,applications_count,specialties(name_ar)",
        )
        .eq("status", "open")
        .order("starts_at", { ascending: true })
        .limit(4);
      if (error) throw error;
      return data as unknown as ShiftRow[];
    },
  });

  const { data: specialties } = useQuery({
    queryKey: ["home-specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,slug,name_ar").limit(12);
      return data ?? [];
    },
  });

  function search(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/jobs" });
  }

  const steps = tab === "employers" ? EMPLOYER_STEPS : SEEKER_STEPS;

  return (
    <>
      {/* Hero */}
      <section className="hero-surface relative overflow-hidden pb-28 md:pb-32">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-14 md:grid-cols-2 md:pt-20">
          <div className="order-2 md:order-1">
            <img
              src={heroImage}
              alt="كوادر صحية عربية في ممر مستشفى حديث"
              width={1600}
              height={1104}
              className="rounded-3xl shadow-2xl"
            />
          </div>

          <div className="order-1 md:order-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20">
              <span className="size-2 rounded-full bg-emerald-400" />
              منصة عربية للتوظيف الطبي
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight font-extrabold text-white md:text-5xl">
              نبني مستقبل التوظيف الطبي
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/85">
              كل الكفاءات الطبية التي تحتاجها — أطباء، صيادلة، تمريض، وفنيون — في مكان واحد.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                asChild
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/for-facilities">ابدأ التوظيف</Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/jobs">تصفّح الوظائف</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4">
          <form
            onSubmit={search}
            className="mx-auto flex max-w-5xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="المسمى الوظيفي، الكلمة المفتاحية، أو التخصص"
                maxLength={80}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface px-3 sm:max-w-64">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder="المدينة أو الموقع"
                maxLength={60}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl px-8">
              تصفّح الوظائف
            </Button>
          </form>
        </div>
      </section>

      {/* Why */}
      <section className="bg-background pt-24 pb-16 md:pt-28">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-sm font-semibold tracking-wide text-accent">
            لماذا SyndeoCare
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((f) => (
              <div key={f.title} className="card-lift rounded-2xl border border-border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two sides */}
      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-extrabold">
            مصمّم لطرفَي الرعاية الصحية
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="card-lift overflow-hidden rounded-3xl border border-border bg-card">
              <img
                src={forProsImage}
                alt="ممرضة تتصفّح شيفتاتها القادمة على هاتفها في ممر مستشفى"
                width={1280}
                height={960}
                loading="lazy"
                className="h-56 w-full object-cover"
              />
              <div className="p-6">
                <span className="text-xs font-semibold text-accent">للباحثين عن عمل</span>
                <h3 className="mt-2 font-display text-xl font-bold">
                  اعثر على شيفتك أو وظيفتك القادمة
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  ارفع سيرتك الذاتية ويبني الذكاء الاصطناعي ملفك في ثوانٍ، ثم تصفّح وظائف وشيفتات
                  موثوقة لدى ناشري وظائف طبية معتمدين وتقدّم فوراً.
                </p>
                <Button className="mt-5" asChild>
                  <Link to="/jobs">تصفّح الوظائف</Link>
                </Button>
              </div>
            </article>

            <article className="card-lift overflow-hidden rounded-3xl border border-border bg-card">
              <img
                src={forEmployersImage}
                alt="مسؤولة توظيف وطبيب يراجعان طلبات التوظيف على جهاز لوحي"
                width={1280}
                height={960}
                loading="lazy"
                className="h-56 w-full object-cover"
              />
              <div className="p-6">
                <span className="text-xs font-semibold text-accent">لناشري الوظائف</span>
                <h3 className="mt-2 font-display text-xl font-bold">وظّف كوادر موثوقة بسرعة</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  انشر وظيفة أو شيفتاً، واستلم تنبيهاً فور تقدّم كادر مؤهّل — فلا يفوتك أي مرشّح
                  مناسب.
                </p>
                <Button className="mt-5" asChild>
                  <Link to="/for-facilities">انشر وظيفة</Link>
                </Button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-sm font-semibold tracking-wide text-accent">
            كيف تعمل المنصة
          </p>
          <h2 className="mt-3 text-center font-display text-3xl font-extrabold">
            من الاستكشاف إلى التوظيف في أربع خطوات واضحة
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            تجربة متكاملة لكلا طرفي رحلة التوظيف الصحي.
          </p>

          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-card p-1">
              {(
                [
                  ["employers", "لناشري الوظائف"],
                  ["seekers", "للباحثين عن عمل"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                    tab === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="card-lift rounded-2xl border border-border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 font-display text-lg font-extrabold text-accent">
                  {i + 1}
                </span>
                {"highlight" in s && s.highlight && (
                  <span className="mt-4 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    {s.highlight}
                  </span>
                )}
                <h3 className="mt-3 text-base font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {tab === "employers" ? (
              <Button asChild>
                <Link to="/for-facilities">ابدأ التوظيف</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  أنشئ ملفك المهني
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* AI CV */}
      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold tracking-wide text-accent">
              تأهيل مدعوم بالذكاء الاصطناعي
            </p>
            <h2 className="mt-3 font-display text-3xl leading-snug font-extrabold">
              ارفع سيرتك الذاتية، ودع الذكاء الاصطناعي يبني ملفّك في ثوانٍ
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              لا مزيد من ملء النماذج الطويلة. ارفع سيرتك مرة واحدة ويحوّلها ذكاء SyndeoCare
              الاصطناعي إلى ملف مهني متكامل — لتبدأ التقديم على الوظائف والشيفتات خلال دقائق لا
              ساعات.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold">للباحثين عن عمل</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>سجّل في أقل من دقيقة — دون نماذج طويلة</li>
                  <li>ملف متكامل واحترافي يلفت الأنظار</li>
                  <li>مطابقة أدقّ مع الوظائف والشيفتات المناسبة</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold">لناشري الوظائف</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>ملفات مرشّحين أكثر اكتمالاً وثراءً</li>
                  <li>مطابقة أفضل مع شواغرك المفتوحة</li>
                  <li>طلبات بجودة أعلى وتواصل أقل</li>
                </ul>
              </div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              يدعم السير الذاتية بالعربية والإنجليزية
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/cv-import">أنشئ ملفك في ثوانٍ</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/jobs">تصفّح الوظائف أولاً</Link>
              </Button>
            </div>
          </div>

          <div className="card-lift rounded-3xl border border-border bg-card p-8">
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <FileUp className="size-5" />
              </span>
              <div>
                <div className="text-sm font-bold">cv.pdf</div>
                <div className="text-xs text-muted-foreground">جارٍ تحليل السيرة الذاتية…</div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {[
                { icon: BadgeCheck, label: "التخصص وسنوات الخبرة" },
                { icon: ShieldCheck, label: "الترخيص المهني والدولة" },
                { icon: Sparkles, label: "المهارات السريرية والملخص المهني" },
                { icon: Building2, label: "جهات العمل السابقة" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm"
                >
                  <row.icon className="size-4 text-accent" />
                  {row.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Latest jobs */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">وظائف دائمة</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">أحدث الوظائف الطبية</h2>
              <p className="mt-2 text-muted-foreground">
                فرص جديدة منشورة من مستشفيات وعيادات ومنشآت متخصصة موثّقة.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/jobs">
                عرض كل الوظائف <ArrowLeft className="size-4" />
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

      {/* Shifts */}
      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">عمل مرن</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">شيفتات متاحة الآن</h2>
              <p className="mt-2 text-muted-foreground">
                احصل على دخل إضافي مع شيفتات حسب الطلب لدى ناشري وظائف موثّقين.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/shifts">
                عرض كل الشيفتات <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-4">
            {shiftsLoading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)
              : shifts?.map((shift) => <ShiftCard key={shift.id} shift={shift} />)}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">حسب التخصص</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">تصفّح حسب التخصص الطبي</h2>
              <p className="mt-2 text-muted-foreground">
                ابحث عن الفرصة المناسبة في مجالك — من الطب العام إلى التخصصات الدقيقة.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/specialties">
                عرض كل التخصصات <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {specialties?.map((s) => (
              <Link
                key={s.id}
                to="/specialties/$slug"
                params={{ slug: s.slug }}
                className="card-lift rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
              >
                {s.name_ar}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="soft-surface py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent">أدلة مهنية</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold">أحدث أدلة المهن الطبية</h2>
              <p className="mt-2 text-muted-foreground">
                إرشادات عملية حول التراخيص والرواتب وتطوير مسيرتك الصحية في المنطقة العربية.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/guides">
                تصفّح كل الأدلة <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {GUIDES.slice(0, 3).map((g) => (
              <Link
                key={g.slug}
                to="/guides/$slug"
                params={{ slug: g.slug }}
                className="card-lift rounded-2xl border border-border bg-card p-6"
              >
                <span className="text-xs font-semibold text-accent">{g.category}</span>
                <h3 className="mt-2 font-display text-lg leading-snug font-bold">{g.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {g.description}
                </p>
                <span className="mt-4 block text-xs text-muted-foreground">
                  {g.readMinutes} دقائق قراءة
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-surface py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white/12 text-white">
            <Bell className="size-6" />
          </span>
          <h2 className="font-display text-3xl font-extrabold text-white">
            ابدأ رحلتك مع SyndeoCare اليوم
          </h2>
          <p className="max-w-xl text-white/85">
            مجانية تماماً للكوادر الصحية، وتجربة 30 يوماً لناشري الوظائف.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/auth" search={{ mode: "signup" }}>
                إنشاء حساب مجاني
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <Link to="/for-facilities">أنا ناشر وظائف</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
