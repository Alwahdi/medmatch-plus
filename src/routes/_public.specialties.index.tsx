import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { specialtyName } from "@/lib/format";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    badge: "تصنيف كامل للمهن الصحية",
    title: "التخصصات الطبية",
    sub: "اختر تخصصك لعرض الوظائف والمناوبات المتاحة فيه عبر الدول العربية.",
    browseAll: "تصفح كل الوظائف",
    categories: {
      doctor: "الأطباء",
      nurse: "التمريض",
      pharmacist: "الصيادلة",
      technician: "الفنيون والفنيات",
      other: "تخصصات أخرى",
    } as Record<string, string>,
  },
  en: {
    badge: "A complete classification of healthcare professions",
    title: "Medical specialties",
    sub: "Choose your specialty to see the jobs and shifts available in it across Arab countries.",
    browseAll: "Browse all jobs",
    categories: {
      doctor: "Physicians",
      nurse: "Nursing",
      pharmacist: "Pharmacists",
      technician: "Technicians",
      other: "Other specialties",
    } as Record<string, string>,
  },
} as const;

export const Route = createFileRoute("/_public/specialties/")({
  head: () => ({
    meta: [
      { title: "التخصصات الطبية | SyndeoCare" },
      {
        name: "description",
        content: "تصفح الوظائف والمناوبات الطبية حسب التخصص: طوارئ، تمريض، صيدلة، أشعة، تخدير وغيرها.",
      },
      { property: "og:title", content: "التخصصات الطبية | SyndeoCare" },
      { property: "og:description", content: "فرص عمل طبية مصنّفة حسب التخصص." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SpecialtiesIndex,
});

function SpecialtiesIndex() {
  const { lang } = useLang();
  const c = TXT[lang];

  const { data } = useQuery({
    queryKey: ["specialties-all"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("specialties")
        .select("id,slug,name_ar,name_en,category")
        .order("category");
      return rows ?? [];
    },
  });

  const groups = (data ?? []).reduce<Record<string, typeof data>>((acc, s) => {
    (acc[s.category] ??= [])!.push(s);
    return acc;
  }, {});

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <Stethoscope className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            {c.sub}
          </p>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-6xl px-4">
          {Object.entries(groups).map(([category, items]) => (
            <section key={category} className="mt-10 first:mt-0">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-bold">{c.categories[category] ?? category}</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/jobs">
                    {c.browseAll} <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items?.map((s) => (
                  <Link
                    key={s.id}
                    to="/specialties/$slug"
                    params={{ slug: s.slug }}
                    className="card-lift flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-accent/30"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Stethoscope className="size-4" />
                    </span>
                    <span>
                      <span className="block font-bold">{specialtyName(s, lang)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {lang === "en" ? s.name_ar : s.name_en}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
