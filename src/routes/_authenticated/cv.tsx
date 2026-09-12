import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { CREDENTIAL_LABELS, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cv")({
  head: () => ({
    meta: [
      { title: "سيرتي الذاتية ATS | SyndeoCare" },
      {
        name: "description",
        content: "سيرة ذاتية طبية بصيغة نصية بسيطة متوافقة مع أنظمة الفرز الآلي ATS، جاهزة للطباعة.",
      },
      { property: "og:title", content: "سيرة ذاتية ATS | SyndeoCare" },
      { property: "og:description", content: "سيرة ذاتية طبية متوافقة مع أنظمة الفرز الآلي." },
    ],
  }),
  component: CvPage,
});

function CvPage() {
  const { user } = useSession();

  const { data: profile } = useQuery({
    queryKey: ["my-pro", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("healthcare_professionals")
        .select("*,specialties(name_ar,name_en)")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: creds } = useQuery({
    queryKey: ["my-creds", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("credentials")
        .select("*")
        .eq("user_id", user!.id)
        .order("issue_date", { ascending: false });
      return data ?? [];
    },
  });

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold">أكمل ملفك المهني أولاً</h1>
        <p className="mt-2 text-muted-foreground">نبني سيرتك تلقائياً من بيانات ملفك ووثائقك.</p>
        <Button className="mt-6" asChild><Link to="/profile">إكمال الملف المهني</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-3xl font-extrabold">سيرتي الذاتية (ATS)</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            تنسيق نصي بسيط بدون جداول أو أعمدة — يقرأه نظام الفرز الآلي بدقة.
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" /> طباعة / حفظ PDF
        </Button>
      </div>

      <article className="mt-6 rounded-2xl border border-border bg-card p-8 leading-relaxed print:border-0 print:p-0">
        <h2 className="font-display text-2xl font-extrabold">{profile.full_name}</h2>
        {profile.headline && <p className="text-muted-foreground">{profile.headline}</p>}
        <p className="mt-1 text-sm text-muted-foreground">
          {[profile.city, profile.country].filter(Boolean).join("، ")}
          {profile.license_number ? ` · رقم الترخيص: ${profile.license_number}` : ""}
        </p>

        <Section title="الملخص المهني">
          <p>
            {profile.bio ||
              `كادر صحي في تخصص ${profile.specialties?.name_ar ?? "غير محدد"} بخبرة ${profile.years_experience} سنة.`}
          </p>
        </Section>

        <Section title="التخصص والخبرة">
          <ul className="list-disc space-y-1 pe-5">
            <li>التخصص: {profile.specialties?.name_ar ?? "غير محدد"}</li>
            <li>سنوات الخبرة: {profile.years_experience}</li>
            {profile.license_country && <li>دولة الترخيص: {profile.license_country}</li>}
            <li>الجاهزية للمناوبات: {profile.is_open_to_shifts ? "متاح" : "غير متاح"}</li>
          </ul>
        </Section>

        <Section title="المؤهلات والتراخيص">
          {creds?.length ? (
            <ul className="list-disc space-y-1 pe-5">
              {creds.map((c) => (
                <li key={c.id}>
                  {c.title} — {c.doc_type}
                  {c.issuer ? ` — ${c.issuer}` : ""}
                  {c.issue_date ? ` (${formatDate(c.issue_date)})` : ""} — {CREDENTIAL_LABELS[c.status]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              لم تُضف وثائق بعد — <Link to="/credentials" className="text-primary underline">أضفها الآن</Link>
            </p>
          )}
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="border-b border-border pb-1 font-bold">{title}</h3>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}
