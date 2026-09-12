import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { parseCv, type ParsedCv } from "@/lib/cv.functions";

export const Route = createFileRoute("/_authenticated/cv-import")({
  head: () => ({
    meta: [
      { title: "بناء الملف من السيرة الذاتية | SyndeoCare" },
      {
        name: "description",
        content: "الصق نص سيرتك الذاتية ونبني ملفك المهني الطبي تلقائياً بالذكاء الاصطناعي.",
      },
      { property: "og:title", content: "بناء الملف من السيرة الذاتية | SyndeoCare" },
      { property: "og:description", content: "ملف مهني جاهز خلال ثوانٍ من سيرتك الذاتية." },
    ],
  }),
  component: CvImport,
});

const AI_ERRORS: Record<string, string> = {
  RATE_LIMIT: "الطلبات كثيرة الآن، جرّب بعد قليل.",
  NO_CREDITS: "رصيد الذكاء الاصطناعي غير كافٍ حالياً.",
  AI_UNAVAILABLE: "خدمة التحليل غير متاحة حالياً.",
  AI_FAILED: "تعذّر تحليل السيرة الذاتية، جرّب نصاً أوضح.",
};

function CvImport() {
  const { user } = useSession();
  const navigate = useNavigate();
  const runParse = useServerFn(parseCv);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParsedCv | null>(null);

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,name_ar,name_en");
      return data ?? [];
    },
  });

  const analyze = useMutation({
    mutationFn: async () => {
      if (text.trim().length < 50) throw new Error("الصق نص السيرة الذاتية كاملاً");
      const res = await runParse({ data: { text: text.trim() } });
      if (!res.profile) throw new Error(AI_ERRORS[res.error ?? "AI_FAILED"] ?? "تعذّر التحليل");
      return res.profile;
    },
    onSuccess: (p) => setResult(p),
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!result) return;
      const hint = result.specialty_hint?.toLowerCase() ?? "";
      const specialty = specialties?.find(
        (s) => hint.includes(s.name_ar) || (s.name_en && hint.includes(s.name_en.toLowerCase())),
      );
      const { error } = await supabase.from("healthcare_professionals").upsert(
        {
          user_id: user!.id,
          full_name: result.full_name ?? "كادر صحي",
          headline: result.headline,
          years_experience: result.years_experience ?? 0,
          country: result.country,
          city: result.city,
          bio: result.bio,
          license_country: result.license_country,
          license_number: result.license_number,
          ...(specialty ? { specialty_id: specialty.id } : {}),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم بناء ملفك المهني");
      navigate({ to: "/profile" });
    },
    onError: () => toast.error("تعذّر حفظ الملف — راجع بياناتك يدوياً"),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">بناء الملف من سيرتك الذاتية</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        الصق نص سيرتك الذاتية، ونستخرج تخصصك وخبرتك وبيانات ترخيصك تلقائياً — ثم راجعها قبل الحفظ.
      </p>

      <Textarea
        rows={12}
        className="mt-6"
        maxLength={20000}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="الصق هنا نص سيرتك الذاتية..."
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => analyze.mutate()} disabled={analyze.isPending}>
          <Sparkles className="size-4" /> {analyze.isPending ? "جارٍ التحليل..." : "حلّل السيرة"}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/profile">تعبئة يدوية</Link>
        </Button>
      </div>

      {result && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-bold">النتيجة المستخرجة</h2>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Field label="الاسم" value={result.full_name} />
            <Field label="المسمى المهني" value={result.headline} />
            <Field label="سنوات الخبرة" value={result.years_experience?.toString() ?? null} />
            <Field label="التخصص" value={result.specialty_hint} />
            <Field label="الدولة" value={result.country} />
            <Field label="المدينة" value={result.city} />
            <Field label="دولة الترخيص" value={result.license_country} />
            <Field label="رقم الترخيص" value={result.license_number} />
          </dl>
          {result.bio && (
            <p className="mt-4 rounded-xl bg-surface p-4 text-sm leading-relaxed">{result.bio}</p>
          )}
          <Button className="mt-5" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "جارٍ الحفظ..." : "احفظ في ملفي المهني"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}
