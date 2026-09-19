import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  text: z.string().trim().min(50, "النص قصير جداً").max(20000, "النص طويل جداً"),
});

export type ParsedCv = {
  full_name: string | null;
  headline: string | null;
  years_experience: number | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  license_country: string | null;
  license_number: string | null;
  specialty_hint: string | null;
};

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
      const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
      return {
        profile: {
          full_name: str(parsed["full_name"]),
          headline: str(parsed["headline"]),
          years_experience:
            typeof parsed["years_experience"] === "number" ? Math.max(0, Math.round(parsed["years_experience"])) : null,
          country: str(parsed["country"]),
          city: str(parsed["city"]),
          bio: str(parsed["bio"]),
          license_country: str(parsed["license_country"]),
          license_number: str(parsed["license_number"]),
          specialty_hint: str(parsed["specialty_hint"]),
        },
      };
    } catch {
      return { profile: null, error: "AI_FAILED" };
    }
  });
