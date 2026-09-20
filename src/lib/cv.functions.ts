import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PROFILE_LIMITS as L } from "@/lib/profile-schema";

const inputSchema = z.object({
  text: z.string().trim().min(50, "النص قصير جداً").max(20000, "النص طويل جداً"),
});

/** تطبيع نص قادم من النموذج: مسافات موحّدة، قصّ على الحد، وفراغ => null. */
const modelText = (max: number) =>
  z
    .unknown()
    .transform((v) => {
      if (typeof v !== "string") return null;
      const t = v.replace(/\s+/g, " ").trim();
      return t ? t.slice(0, max) : null;
    })
    .pipe(z.string().max(max).nullable());

// لا نثق بأي حقل خارج هذا العقد: لا روابط، لا HTML، ولا أي حقل توثيق.
const parsedCvSchema = z.object({
  full_name: modelText(L.fullName),
  headline: modelText(L.headline),
  years_experience: z
    .unknown()
    .transform((v) =>
      typeof v === "number" && Number.isFinite(v)
        ? Math.min(L.yearsMax, Math.max(L.yearsMin, Math.round(v)))
        : null,
    )
    .pipe(z.number().int().min(L.yearsMin).max(L.yearsMax).nullable()),
  country: modelText(L.country),
  city: modelText(L.city),
  bio: modelText(L.bio),
  license_country: modelText(L.licenseCountry),
  license_number: modelText(L.licenseNumber),
  specialty_hint: modelText(L.specialtyHint),
});

export type ParsedCv = z.infer<typeof parsedCvSchema>;

// حدود الاستخدام مطبّقة في قاعدة البيانات (consume_ai_quota): 5/ساعة و20/يوم لكل مستخدم.
const AI_FEATURE = "cv_parse";

export const parseCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({
    data,
    context,
  }): Promise<{ profile: ParsedCv | null; error?: string; retryAfterSeconds?: number }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { profile: null, error: "AI_UNAVAILABLE" };

    // بوابة نوع الحساب قبل استهلاك أي حصة أو الوصول للمزود:
    // الميزة خاصة ببناء ملف الكادر الصحي. حسابات المنشآت مرفوضة،
    // بينما يُسمح للحساب الجديد بلا دور لأن التهيئة قد تبدأ باستيراد السيرة.
    const [{ data: facilityRow }, { data: roleRow }] = await Promise.all([
      context.supabase.from("facilities").select("id").eq("owner_id", context.userId).limit(1).maybeSingle(),
      context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "facility")
        .limit(1)
        .maybeSingle(),
    ]);
    if (facilityRow || roleRow) return { profile: null, error: "PROFESSIONAL_FEATURE_ONLY" };

    // احتساب المحاولة قبل الوصول لمزود الذكاء الاصطناعي — الفشل لاحقاً يبقى محتسباً.
    const { data: quota, error: quotaError } = await context.supabase.rpc("consume_ai_quota", {
      _feature: AI_FEATURE,
    });
    if (quotaError) return { profile: null, error: "AI_UNAVAILABLE" };
    const q = (quota ?? {}) as { allowed?: boolean; retry_after_seconds?: number };
    if (!q.allowed) {
      return {
        profile: null,
        error: "AI_RATE_LIMIT",
        retryAfterSeconds:
          typeof q.retry_after_seconds === "number" ? Math.max(1, q.retry_after_seconds) : 3600,
      };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "أنت مساعد يستخرج بيانات الملف المهني الطبي من نص سيرة ذاتية. أعد النتيجة عبر استدعاء الأداة فقط، بالعربية حيثما أمكن، واترك أي حقل غير موجود فارغاً (null).",
          },
          { role: "user", content: data.text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_profile",
              description: "حفظ بيانات الملف المهني المستخرجة",
              parameters: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  headline: { type: "string", description: "مسمى مهني مختصر" },
                  years_experience: { type: "number" },
                  country: { type: "string" },
                  city: { type: "string" },
                  bio: { type: "string", description: "ملخص مهني من 2-4 جمل" },
                  license_country: { type: "string" },
                  license_number: { type: "string" },
                  specialty_hint: { type: "string", description: "اسم التخصص الطبي" },
                },
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_profile" } },
      }),
    });

    if (res.status === 429) return { profile: null, error: "RATE_LIMIT" };
    if (res.status === 402) return { profile: null, error: "NO_CREDITS" };
    if (!res.ok) return { profile: null, error: "AI_FAILED" };

    const json = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return { profile: null, error: "AI_FAILED" };

    try {
      const parsed = JSON.parse(args) as Record<string, unknown>;
      // حدود صارمة على مخرجات النموذج حتى لا يُنتج قيماً غير منطقية.
      const str = (v: unknown, max: number) => {
        if (typeof v !== "string") return null;
        const t = v.replace(/\s+/g, " ").trim();
        return t ? t.slice(0, max) : null;
      };
      const yearsRaw = parsed["years_experience"];
      const years =
        typeof yearsRaw === "number" && Number.isFinite(yearsRaw)
          ? Math.min(60, Math.max(0, Math.round(yearsRaw)))
          : null;
      return {
        profile: {
          full_name: str(parsed["full_name"], 120),
          headline: str(parsed["headline"], 160),
          years_experience: years,
          country: str(parsed["country"], 60),
          city: str(parsed["city"], 60),
          bio: str(parsed["bio"], 1000),
          license_country: str(parsed["license_country"], 60),
          license_number: str(parsed["license_number"], 60),
          specialty_hint: str(parsed["specialty_hint"], 80),
        },
      };
    } catch {
      return { profile: null, error: "AI_FAILED" };
    }
  });
