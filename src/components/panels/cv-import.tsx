import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { assertOk } from "@/lib/query-errors";
import { useSession } from "@/lib/auth";
import { parseCv, type ParsedCv } from "@/lib/cv.functions";
import { useLang } from "@/lib/i18n";
import { friendlyError, UserFacingError } from "@/lib/user-errors";
import { CV_FILE_LIMITS, CvExtractError, type CvExtractErrorCode } from "@/lib/cv-extract";


const TXT = {
  ar: {
    title: "بناء الملف من سيرتك الذاتية",
    sub: "ارفع ملف سيرتك الذاتية أو الصق نصها، ونستخرج تخصصك وخبرتك وبيانات ترخيصك — ثم راجعها قبل الحفظ.",
    placeholder: "الصق هنا نص سيرتك الذاتية...",
    methodUpload: "رفع ملف",
    methodPaste: "لصق النص",
    dropTitle: "اختر ملف سيرتك الذاتية",
    dropHint: "PDF أو DOCX أو TXT — حتى ٥ ميجابايت",
    dropDesktop: "أو اسحب الملف وأفلته هنا",
    localNotice:
      "الملف نفسه لا يُحفظ؛ نستخرج النص في جهازك ثم ترسل النص للتحليل عند الضغط على تحليل.",
    remove: "إزالة الملف",
    replace: "استبدال الملف",
    extracting: "جارٍ استخراج النص...",
    extracted: "تم استخراج النص، راجعه قبل التحليل.",
    truncated: (n: number) =>
      `النص المستخرج (${n} حرفاً) أطول من الحد المسموح للتحليل، فعُرض أول ٢٠٬٠٠٠ حرف فقط. راجعه واختصره قبل التحليل.`,
    analyze: "حلّل السيرة",
    analyzing: "جارٍ التحليل...",
    manual: "تعبئة يدوية",
    resultTitle: "النتيجة المستخرجة",
    name: "الاسم",
    headline: "المسمى المهني",
    years: "سنوات الخبرة",
    specialty: "التخصص",
    country: "الدولة",
    city: "المدينة",
    licenseCountry: "دولة الترخيص",
    licenseNumber: "رقم الترخيص",
    save: "احفظ في ملفي المهني",
    saving: "جارٍ الحفظ...",
    tooShort: "الصق نص السيرة الذاتية كاملاً",
    genericHealthcare: "كادر صحي",
    saved: "تم بناء ملفك المهني",
    specialtyUnmatched: "التخصص لم يُطابق تلقائياً — اختره يدوياً من صفحة ملفك.",
    saveFailed: "تعذّر حفظ الملف — راجع بياناتك يدوياً",
    tooManyRequests: "الطلبات كثيرة الآن، جرّب بعد قليل.",
    cooldownMin: (m: number) => `بلغت الحد المسموح لتحليل السيرة الذاتية مؤقتاً. جرّب بعد ${m} دقيقة. نصّك المكتوب محفوظ كما هو.`,
    cooldownHour: (h: number) => `بلغت الحد المسموح لتحليل السيرة الذاتية اليوم. جرّب بعد ${h} ساعة. نصّك المكتوب محفوظ كما هو.`,
    noCredits: "رصيد الذكاء الاصطناعي غير كافٍ حالياً.",
    unavailable: "خدمة التحليل غير متاحة حالياً. يمكنك إكمال ملفك يدوياً، ونصّك محفوظ كما هو.",
    failed: "تعذّر اقتراح البيانات بالذكاء الاصطناعي. يمكنك إكمال ملفك يدوياً، ونصّك محفوظ كما هو.",
    facilityOnly: "تحليل السيرة الذاتية متاح لحسابات الكوادر الصحية فقط.",
    aiNotice:
      "استخراج النص من الملف يتم داخل جهازك. وعند اختيار التحليل بالذكاء الاصطناعي، يُرسل النص المستخرج إلى خدمة معالجة خارجية لاقتراح بيانات ملفك. راجع النتائج قبل حفظها، ولا يُستخدم التحليل كتأكيد للترخيص. تجنّب إدراج معلومات حساسة غير ضرورية، ويمكنك دائماً التعبئة يدوياً بدل التحليل.",
    err: {
      TOO_LARGE: "حجم الملف أكبر من ٥ ميجابايت. جرّب ملفاً أصغر أو الصق النص.",
      UNSUPPORTED_TYPE: "نوع الملف غير مدعوم. المدعوم: PDF وDOCX وTXT.",
      LEGACY_DOC: "ملفات ‎.doc القديمة غير مدعومة. احفظ الملف بصيغة DOCX أو PDF، أو الصق النص.",
      PDF_ENCRYPTED: "الملف محمي بكلمة مرور ولا يمكن قراءته. أزل الحماية أو الصق النص.",
      PDF_TOO_MANY_PAGES: `عدد صفحات الملف أكبر من ${CV_FILE_LIMITS.maxPdfPages} صفحة. ارفع نسخة أقصر أو الصق النص.`,
      CORRUPT: "تعذّرت قراءة الملف. قد يكون تالفاً — جرّب ملفاً آخر أو الصق النص.",
      TOO_SHORT: "النص المستخرج قصير جداً. قد يكون الملف صوراً ممسوحة — الصق النص يدوياً.",
    } satisfies Record<CvExtractErrorCode, string>,
  },
  en: {
    title: "Build your profile from your CV",
    sub: "Upload your CV file or paste its text, and we'll extract your specialty, experience, and license details — then review before saving.",
    placeholder: "Paste your CV text here...",
    methodUpload: "Upload file",
    methodPaste: "Paste text",
    dropTitle: "Choose your CV file",
    dropHint: "PDF, DOCX or TXT — up to 5 MB",
    dropDesktop: "or drag and drop the file here",
    localNotice:
      "The file itself is never stored; the text is extracted on your device, and only the text is sent when you tap Analyze.",
    remove: "Remove file",
    replace: "Replace file",
    extracting: "Extracting text...",
    extracted: "Text extracted — review it before analysis.",
    truncated: (n: number) =>
      `The extracted text (${n} characters) is longer than the analysis limit, so only the first 20,000 characters are shown. Review and trim before analysis.`,
    analyze: "Analyze CV",
    analyzing: "Analyzing...",
    manual: "Fill manually",
    resultTitle: "Extracted result",
    name: "Name",
    headline: "Professional headline",
    years: "Years of experience",
    specialty: "Specialty",
    country: "Country",
    city: "City",
    licenseCountry: "Country of license",
    licenseNumber: "License number",
    save: "Save to my profile",
    saving: "Saving...",
    tooShort: "Paste your full CV text",
    genericHealthcare: "Healthcare professional",
    saved: "Your profile has been built",
    specialtyUnmatched: "Specialty wasn't matched automatically — pick it manually on your profile page.",
    saveFailed: "Failed to save profile — please review your details manually",
    tooManyRequests: "Too many requests right now, try again shortly.",
    cooldownMin: (m: number) => `You've reached the CV analysis limit for now. Try again in ${m} min. Your text is preserved.`,
    cooldownHour: (h: number) => `You've reached today's CV analysis limit. Try again in ${h} h. Your text is preserved.`,
    noCredits: "AI credit is currently insufficient.",
    unavailable:
      "The analysis service is currently unavailable. You can still complete your profile manually — your text is preserved.",
    failed:
      "The AI suggestion failed. You can still complete your profile manually — your text is preserved.",
    facilityOnly: "CV analysis is available to healthcare professional accounts only.",
    aiNotice:
      "Text extraction happens on your device. When you choose AI analysis, the extracted text is sent to an external processing service to suggest your profile details. Review the results before saving; the analysis is not a confirmation of licensing. Avoid including unnecessary sensitive information — you can always fill the profile manually instead.",
    err: {
      TOO_LARGE: "The file is larger than 5 MB. Try a smaller file or paste the text.",
      UNSUPPORTED_TYPE: "Unsupported file type. Supported: PDF, DOCX and TXT.",
      LEGACY_DOC: "Legacy .doc files aren't supported. Save as DOCX or PDF, or paste the text.",
      PDF_ENCRYPTED: "The file is password-protected and can't be read. Remove the protection or paste the text.",
      PDF_TOO_MANY_PAGES: `The file has more than ${CV_FILE_LIMITS.maxPdfPages} pages. Upload a shorter version or paste the text.`,
      CORRUPT: "The file couldn't be read. It may be corrupt — try another file or paste the text.",
      TOO_SHORT: "The extracted text is too short. The file may be scanned images — paste the text manually.",
    } satisfies Record<CvExtractErrorCode, string>,
  },
} as const;

function formatSize(bytes: number, lang: "ar" | "en") {
  const mb = bytes / (1024 * 1024);
  const value = mb >= 0.1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return lang === "ar" ? value.replace("MB", "م.ب").replace("KB", "ك.ب") : value;
}

export function CvImportPanel() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const runParse = useServerFn(parseCv);
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParsedCv | null>(null);
  const [method, setMethod] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cooldownMessage = (seconds: number) => {
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return minutes >= 60 ? c.cooldownHour(Math.ceil(minutes / 60)) : c.cooldownMin(minutes);
  };

  const AI_ERRORS: Record<string, string> = {
    RATE_LIMIT: c.tooManyRequests,
    NO_CREDITS: c.noCredits,
    AI_UNAVAILABLE: c.unavailable,
    AI_FAILED: c.failed,
    PROFESSIONAL_FEATURE_ONLY: c.facilityOnly,
  };

  const handleFile = async (picked: File) => {
    setStatus(c.extracting);
    setProgress(0);
    setFile({ name: picked.name, size: picked.size });
    try {
      const { extractCvText } = await import("@/lib/cv-extract");
      const res = await extractCvText(picked, (pct) => setProgress(pct));
      setText(res.text);
      setProgress(100);
      if (res.truncated) {
        const msg = c.truncated(res.originalLength);
        setStatus(msg);
        toast.warning(msg);
      } else {
        setStatus(c.extracted);
      }
    } catch (e) {
      // لا يُسجَّل أي جزء من محتوى الملف.
      const code = e instanceof CvExtractError ? e.code : "CORRUPT";
      setProgress(null);
      setFile(null);
      setStatus(c.err[code]);
      toast.error(c.err[code]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setProgress(null);
    setStatus("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = useMutation({
    mutationFn: async () => {
      if (text.trim().length < CV_FILE_LIMITS.minChars) throw new UserFacingError(c.tooShort);
      const res = await runParse({ data: { text: text.trim() } });
      if (res.error === "AI_RATE_LIMIT") {
        throw new UserFacingError(cooldownMessage(res.retryAfterSeconds ?? 3600));
      }
      if (!res.profile) throw new UserFacingError(AI_ERRORS[res.error ?? "AI_FAILED"] ?? c.failed);
      return res.profile;
    },
    onSuccess: (p) => setResult(p),
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.failed)),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!result) return { matched: true };
      const hint = result.specialty_hint?.toLowerCase() ?? "";
      const specialty = specialties?.find(
        (s) => hint.includes(s.name_ar) || (s.name_en && hint.includes(s.name_en.toLowerCase())),
      );
      const { error } = await supabase.from("healthcare_professionals").upsert(
        {
          user_id: user!.id,
          full_name: result.full_name ?? c.genericHealthcare,
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
      // تفعيل دور الكادر بعد إنشاء الملف — حتى لا يعود المستخدم لشاشة الإعداد.
      // إن لم يكتمل الملف (تخصص غير مطابق مثلاً) يرفض الخادم ويبقى المستخدم في الإعداد.
      try {
        assertOk(await supabase.rpc("claim_professional_role"));
      } catch (e) {
        if (specialty) throw e;
      }
      return { matched: Boolean(specialty) };
    },
    onSuccess: (r) => {
      toast.success(c.saved);
      if (r && !r.matched) toast.warning(c.specialtyUnmatched);
      void queryClient.invalidateQueries({ queryKey: ["roles", user?.id] });
      void queryClient.invalidateQueries({ queryKey: ["my-pro", user?.id] });
      navigate({ to: "/profile" });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.saveFailed)),
  });

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.sub}</p>

      <div className="mt-6 flex gap-2" role="tablist" aria-label={c.title}>
        <Button
          role="tab"
          aria-selected={method === "upload"}
          variant={method === "upload" ? "default" : "outline"}
          onClick={() => setMethod("upload")}
        >
          <Upload className="size-4" /> {c.methodUpload}
        </Button>
        <Button
          role="tab"
          aria-selected={method === "paste"}
          variant={method === "paste" ? "default" : "outline"}
          onClick={() => setMethod("paste")}
        >
          <FileText className="size-4" /> {c.methodPaste}
        </Button>
      </div>

      {method === "upload" && (
        <div className="mt-4">
          <label
            htmlFor="cv-file"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) void handleFile(dropped);
            }}
            className={`flex min-h-[8rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring ${
              dragging ? "border-primary bg-primary/5" : "border-border bg-surface"
            }`}
          >
            <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium">{c.dropTitle}</span>
            <span className="text-xs text-muted-foreground">{c.dropHint}</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">{c.dropDesktop}</span>
            <input
              id="cv-file"
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="sr-only"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) void handleFile(picked);
              }}
            />
          </label>

          <p className="mt-2 text-xs text-muted-foreground">{c.localNotice}</p>

          {file && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size, lang)}</p>
                {progress !== null && progress < 100 && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={c.remove}
                className="min-h-11 min-w-11 shrink-0"
                onClick={clearFile}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
            {status}
          </p>
        </div>
      )}

      <Textarea
        rows={12}
        className="mt-4"
        maxLength={CV_FILE_LIMITS.maxChars}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={c.placeholder}
        aria-label={c.methodPaste}
      />
      <p
        id="cv-ai-notice"
        className="mt-3 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground"
      >
        {c.aiNotice}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          onClick={() => analyze.mutate()}
          loading={analyze.isPending}
          aria-describedby="cv-ai-notice"
        >
          <Sparkles className="size-4" /> {analyze.isPending ? c.analyzing : c.analyze}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/profile">{c.manual}</Link>
        </Button>
      </div>

      {result && (
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="font-bold">{c.resultTitle}</h2>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Field label={c.name} value={result.full_name} />
            <Field label={c.headline} value={result.headline} />
            <Field label={c.years} value={result.years_experience?.toString() ?? null} />
            <Field label={c.specialty} value={result.specialty_hint} />
            <Field label={c.country} value={result.country} />
            <Field label={c.city} value={result.city} />
            <Field label={c.licenseCountry} value={result.license_country} />
            <Field label={c.licenseNumber} value={result.license_number} />
          </dl>
          {result.bio && (
            <p className="mt-4 rounded-lg bg-surface p-4 text-sm leading-relaxed">{result.bio}</p>
          )}
          <Button className="mt-5" onClick={() => save.mutate()} loading={save.isPending}>
            {save.isPending ? c.saving : c.save}
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
