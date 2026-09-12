import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "أسعار المنشآت — باقات التوظيف الطبي | SyndeoCare" },
      {
        name: "description",
        content:
          "باقات SyndeoCare للمنشآت الصحية: تجربة مجانية 30 يوماً، نشر وظائف ومناوبات، بحث المرشحين وأرصدة الذكاء الاصطناعي. الكادر الطبي يستخدم المنصة مجاناً.",
      },
      { property: "og:title", content: "أسعار المنشآت | SyndeoCare" },
      {
        property: "og:description",
        content: "تجربة مجانية 30 يوماً ثم باقات مرنة لنشر الوظائف والمناوبات الطبية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  code: string;
  name_ar: string;
  description_ar: string | null;
  price_monthly: number;
  price_yearly: number;
  list_price_monthly: number | null;
  currency: string;
  active_jobs: number;
  active_shifts: number;
  featured_jobs: number;
  urgent_shifts: number;
  candidate_searches: number;
  ai_credits: number;
  recruiter_seats: number;
  is_trial: boolean;
};

function PricingPage() {
  const [yearly, setYearly] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as Plan[];
    },
  });

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <Sparkles className="size-4" />
            الكادر الطبي يستخدم المنصة مجاناً بالكامل
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">
            باقات المنشآت الصحية
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            ابدأ بتجربة مجانية 30 يوماً بدون بطاقة دفع. تُفعّل تلقائياً لحظة تسجيل منشأتك، وتنشر
            خلالها وظائف ومناوبات حقيقية.
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex justify-center">
            <div className="inline-flex -translate-y-1/2 rounded-2xl border border-border bg-card p-1.5 shadow-lg">
              <button
                onClick={() => setYearly(false)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                  !yearly
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                شهري
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                  yearly
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                سنوي · شهران مجاناً
              </button>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {plans?.map((p) => {
              const price = yearly ? Number(p.price_yearly) : Number(p.price_monthly);
              const highlight = p.code === "pro";
              return (
                <div
                  key={p.code}
                  className={`card-lift flex flex-col rounded-2xl border bg-card p-6 ${
                    highlight ? "border-primary shadow-lg" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl font-bold">{p.name_ar}</h2>
                    {highlight && <Badge>الأكثر اختياراً</Badge>}
                    {p.is_trial && <Badge variant="secondary">30 يوماً</Badge>}
                  </div>
                  <p className="mt-2 min-h-10 text-sm text-muted-foreground">{p.description_ar}</p>

                  <div className="mt-5">
                    <span className="font-display text-3xl font-extrabold text-primary">
                      {price === 0 ? "مجاناً" : formatMoney(price, p.currency)}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / {yearly ? "سنة" : "شهر"}
                      </span>
                    )}
                    {!yearly && p.list_price_monthly && (
                      <span className="mr-2 text-sm text-muted-foreground line-through">
                        {formatMoney(Number(p.list_price_monthly), p.currency)}
                      </span>
                    )}
                  </div>

                  <ul className="mt-6 space-y-2.5 text-sm">
                    <Feature>{p.active_jobs} وظيفة نشطة</Feature>
                    <Feature>{p.active_shifts} مناوبة نشطة</Feature>
                    <Feature>{p.featured_jobs} إعلان مميّز</Feature>
                    <Feature>{p.urgent_shifts} مناوبة مستعجلة</Feature>
                    <Feature>{p.candidate_searches} عملية بحث عن المرشحين شهرياً</Feature>
                    <Feature>{p.ai_credits} رصيد ذكاء اصطناعي</Feature>
                    <Feature>
                      {p.recruiter_seats} {p.recruiter_seats > 1 ? "مقاعد" : "مقعد"} لمسؤولي
                      التوظيف
                    </Feature>
                  </ul>

                  <Button
                    className="mt-6 w-full"
                    variant={highlight ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/auth" search={{ mode: "signup" }}>
                      {p.is_trial ? "ابدأ التجربة المجانية" : "سجّل منشأتك"}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="card-lift rounded-2xl border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">لماذا نُخفي اسم المنشأة؟</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                إعلانات SyndeoCare مجهّلة الهوية: يرى الباحث المسمى والتخصص والراتب والموقع وشارة
                «ناشر موثّق»، بينما تظهر هوية المنشأة عند التواصل مع المرشح. هذا يحمي خطط التوظيف
                الداخلية للمنشأة ويمنع المقارنات غير العادلة بين الفرق.
              </p>
            </div>
            <div className="card-lift rounded-2xl border border-border bg-card p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ArrowLeft className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold">هل أنت كادر صحي؟</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                استخدام SyndeoCare مجاني تماماً للباحثين عن عمل. أنشئ ملفك، وثّق ترخيصك، وتقدم
                على الوظائف والشيفتات بدون أي رسوم.
              </p>
              <Button className="mt-4" variant="outline" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  إنشاء حساب مجاني
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
      <span>{children}</span>
    </li>
  );
}
