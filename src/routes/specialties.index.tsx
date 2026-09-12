import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/specialties/")({
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
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">التخصصات الطبية</h1>
      <p className="mt-3 text-muted-foreground">
        اختر تخصصك لعرض الوظائف والمناوبات المتاحة فيه عبر الدول العربية.
      </p>

      {Object.entries(groups).map(([category, items]) => (
        <section key={category} className="mt-10">
          <h2 className="font-display text-xl font-bold">{category}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items?.map((s) => (
              <Link
                key={s.id}
                to="/specialties/$slug"
                params={{ slug: s.slug }}
                className="card-lift flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Stethoscope className="size-4" />
                </span>
                <span>
                  <span className="block font-bold">{s.name_ar}</span>
                  <span className="block text-xs text-muted-foreground">{s.name_en}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
