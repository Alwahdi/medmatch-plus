/**
 * Phase 54 — canonical URLs and shared share-metadata helpers.
 *
 * كل الروابط الأساسية (canonical / og:url) تُبنى من نطاق واحد،
 * وصورة المشاركة أصل عام ثابت من هوية المنصة — لا صور مستخدمين أو منشآت.
 */

export const SITE_URL = "https://syndeocare.ai";

/** صورة المشاركة الافتراضية (1200x630) — أصل عام لا يحتوي بيانات أي مستخدم. */
export const OG_IMAGE = `${SITE_URL}/og-cover.png`;

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `${SITE_URL}/` : `${SITE_URL}${clean.replace(/\/+$/, "")}`;
}

type MetaEntry = { name?: string; property?: string; content: string; title?: string };

/** og:url + og:image + twitter:image لصفحة عامة. */
export function shareMeta(path: string, image: string = OG_IMAGE): MetaEntry[] {
  return [
    { property: "og:url", content: absoluteUrl(path) },
    { property: "og:image", content: image },
    { name: "twitter:image", content: image },
  ];
}

/** رابط canonical للصفحة (يوضع على الصفحات النهائية فقط). */
export function canonical(path: string) {
  return [{ rel: "canonical", href: absoluteUrl(path) }];
}

/** صفحات خاصة/تسجيل الدخول لا تُفهرس. */
export const NOINDEX = { name: "robots", content: "noindex,nofollow" } as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * المسار الأساسي (canonical) لصفحة وظيفة: دائماً الـslug عند وجوده،
 * حتى لا يتكرر نفس المحتوى بين رابط الـslug ورابط المعرّف.
 * قراءة عامة من العرض المنقّح فقط (لا بيانات ناشر أو مالك).
 */
export async function jobCanonicalPath(param: string): Promise<string> {
  if (!UUID_RE.test(param)) return `/jobs/${param}`;
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return `/jobs/${param}`;
  try {
    const res = await fetch(`${url}/rest/v1/public_jobs?select=slug&id=eq.${encodeURIComponent(param)}`, {
      headers: { apikey: key as string, Accept: "application/json" },
    });
    if (!res.ok) return `/jobs/${param}`;
    const rows = (await res.json()) as { slug?: string | null }[];
    const slug = rows[0]?.slug;
    return slug ? `/jobs/${slug}` : `/jobs/${param}`;
  } catch {
    return `/jobs/${param}`;
  }
}

/* ---------------------------------------------------------------------------
 * Phase 89 — بيانات وصفية ديناميكية للفرص العامة (بدون أي كشف لهوية الناشر)
 * القراءة من العروض المنقّحة public_jobs / public_shifts فقط، عبر المفتاح العام،
 * فتُنتَج الوسوم على الخادم دون الوصول لأي صف خاص أو بيانات منشأة.
 * ------------------------------------------------------------------------- */

async function publicRest<T>(path: string): Promise<T[] | null> {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: { apikey: key as string, Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

export type PublicJobMeta = {
  slug: string | null;
  title: string;
  city: string | null;
  country: string | null;
  specialty: string | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
};

export type PublicShiftMeta = {
  title: string;
  city: string | null;
  country: string | null;
  specialty: string | null;
  startsAt: string | null;
  hourlyRate: number | null;
  currency: string | null;
};

const JOB_META_COLUMNS =
  "slug,title,city,country,specialty_name_ar,employment_type,salary_min,salary_max,currency";
const SHIFT_META_COLUMNS = "title,city,country,specialty_name_ar,starts_at,hourly_rate,currency";

type JobMetaRow = {
  slug: string | null; title: string; city: string | null; country: string | null;
  specialty_name_ar: string | null; employment_type: string | null;
  salary_min: number | null; salary_max: number | null; currency: string | null;
};

type ShiftMetaRow = {
  title: string; city: string | null; country: string | null; specialty_name_ar: string | null;
  starts_at: string | null; hourly_rate: number | null; currency: string | null;
};

/** صف الوظيفة العامة اللازم للوسوم فقط — يعود null للوظائف المغلقة/غير العامة. */
export async function fetchPublicJobMeta(param: string): Promise<PublicJobMeta | null> {
  const filter = UUID_RE.test(param)
    ? `id=eq.${encodeURIComponent(param)}`
    : `slug=eq.${encodeURIComponent(param)}`;
  const rows = await publicRest<JobMetaRow>(`public_jobs?select=${JOB_META_COLUMNS}&${filter}&limit=1`);
  const r = rows?.[0];
  if (!r) return null;
  return {
    slug: r.slug, title: r.title, city: r.city, country: r.country,
    specialty: r.specialty_name_ar, employmentType: r.employment_type,
    salaryMin: r.salary_min, salaryMax: r.salary_max, currency: r.currency,
  };
}

/** صف المناوبة العامة اللازم للوسوم فقط — يعود null للمناوبات المحجوزة/المنتهية. */
export async function fetchPublicShiftMeta(id: string): Promise<PublicShiftMeta | null> {
  if (!UUID_RE.test(id)) return null;
  const rows = await publicRest<ShiftMetaRow>(
    `public_shifts?select=${SHIFT_META_COLUMNS}&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  const r = rows?.[0];
  if (!r) return null;
  return {
    title: r.title, city: r.city, country: r.country, specialty: r.specialty_name_ar,
    startsAt: r.starts_at, hourlyRate: r.hourly_rate, currency: r.currency,
  };
}

function place(city: string | null, country: string | null): string {
  return [city, country].filter(Boolean).join("، ");
}

function num(v: number): string {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 }).format(v);
}

const EMPLOYMENT_AR: Record<string, string> = {
  full_time: "دوام كامل", part_time: "دوام جزئي", contract: "عقد مؤقت",
  locum: "بديل مؤقت", internship: "تدريب", remote: "عن بُعد",
};

/** عنوان ووصف مختصران لوظيفة عامة — بلا اسم منشأة ولا أي بيانات تواصل. */
export function jobSeoText(m: PublicJobMeta) {
  const loc = place(m.city, m.country);
  const title = `${m.title}${loc ? ` — ${loc}` : ""} | SyndeoCare`;
  const parts = [
    m.specialty ? `تخصص ${m.specialty}` : null,
    loc || null,
    m.employmentType ? (EMPLOYMENT_AR[m.employmentType] ?? m.employmentType) : null,
    m.salaryMin && m.salaryMax && m.currency
      ? `راتب ${num(m.salaryMin)} – ${num(m.salaryMax)} ${m.currency} شهرياً`
      : null,
  ].filter(Boolean);
  const summary = parts.length ? `${m.title}: ${parts.join(" · ")}` : m.title;
  const description = `${summary}. قدّم مباشرة عبر SyndeoCare.`;
  return { title, description: description.slice(0, 300) };
}

/** عنوان ووصف مختصران لمناوبة عامة. */
export function shiftSeoText(m: PublicShiftMeta) {
  const loc = place(m.city, m.country);
  const title = `${m.title}${loc ? ` — ${loc}` : ""} | SyndeoCare`;
  const when = m.startsAt
    ? new Date(m.startsAt).toLocaleDateString("ar-EG-u-nu-latn", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
      })
    : null;
  const parts = [
    m.specialty ? `تخصص ${m.specialty}` : null,
    loc || null,
    when ? `تبدأ ${when}` : null,
    m.hourlyRate && m.currency ? `${num(m.hourlyRate)} ${m.currency} للساعة` : null,
  ].filter(Boolean);
  const summary = parts.length ? `${m.title}: ${parts.join(" · ")}` : m.title;
  const description = `مناوبة ${summary}. احجزها مباشرة عبر SyndeoCare.`;
  return { title, description: description.slice(0, 300) };
}
