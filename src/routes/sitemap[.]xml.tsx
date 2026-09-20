import { createFileRoute } from "@tanstack/react-router";

import { POSTS } from "@/content/blog";
import { GUIDES } from "@/content/guides";
import { QUESTION_BANKS } from "@/content/question-banks";
import { SITE_URL } from "@/lib/seo";

/**
 * Phase 54 — sitemap ديناميكي.
 *
 * يشمل الصفحات العامة الثابتة + المحتوى التحريري + الفرص العامة الحيّة فقط
 * من العرضين المنقّحين public_jobs / public_shifts.
 * لا يشمل أي مسار خاص أو صفحة تسجيل دخول أو مسار محوّل مثل /pricing.
 */

const STATIC_PATHS = [
  "/",
  "/jobs",
  "/shifts",
  "/specialties",
  "/for-facilities",
  "/about",
  "/contact",
  "/blog",
  "/guides",
  "/interview-questions",
  "/privacy",
  "/terms",
  "/cookies",
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(path: string, lastmod?: string | null): string {
  const loc = escapeXml(`${SITE_URL}${path}`);
  const iso = lastmod ? new Date(lastmod) : null;
  const stamp = iso && !Number.isNaN(iso.getTime()) ? `\n    <lastmod>${iso.toISOString().slice(0, 10)}</lastmod>` : "";
  return `  <url>\n    <loc>${loc}</loc>${stamp}\n  </url>`;
}

type Row = Record<string, unknown>;

async function restSelect(table: string, select: string): Promise<Row[]> {
  const url = process.env["VITE_SUPABASE_URL"] ?? import.meta.env["VITE_SUPABASE_URL"];
  const key =
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=${select}&limit=5000`, {
      headers: { apikey: key as string, Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`[sitemap] ${table} read failed`, res.status);
      return [];
    }
    return (await res.json()) as Row[];
  } catch (e) {
    console.error(`[sitemap] ${table} read error`, e);
    return [];
  }
}

async function buildSitemap(): Promise<string> {
  const entries: string[] = STATIC_PATHS.map((p) => urlEntry(p));

  for (const post of POSTS) entries.push(urlEntry(`/blog/${post.slug}`, post.date));
  for (const guide of GUIDES) entries.push(urlEntry(`/guides/${guide.slug}`));
  for (const bank of QUESTION_BANKS) entries.push(urlEntry(`/interview-questions/${bank.slug}`));

  const [specialties, jobs, shifts] = await Promise.all([
    restSelect("specialties", "slug"),
    restSelect("public_jobs", "id,slug,created_at"),
    restSelect("public_shifts", "id,created_at"),
  ]);

  for (const s of specialties) {
    if (typeof s["slug"] === "string" && s["slug"]) entries.push(urlEntry(`/specialties/${s["slug"]}`));
  }
  for (const j of jobs) {
    const slug = typeof j["slug"] === "string" && j["slug"] ? j["slug"] : String(j["id"] ?? "");
    if (!slug) continue;
    entries.push(urlEntry(`/jobs/${slug}`, typeof j["created_at"] === "string" ? j["created_at"] : null));
  }
  for (const sh of shifts) {
    const id = String(sh["id"] ?? "");
    if (!id) continue;
    entries.push(urlEntry(`/shifts/${id}`, typeof sh["created_at"] === "string" ? sh["created_at"] : null));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = await buildSitemap();
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
