/**
 * Job/shift alert dispatcher.
 *
 * Finds new listings that match each active alert, sends them through the
 * configured channel (email / WhatsApp) and records exactly one logical row per
 * (alert, listing, channel) in `alert_deliveries`.
 *
 * Delivery semantics:
 * - Only `status = 'sent'` is a permanent delivery; that pair is never retried.
 * - `not_configured` rows are retried as soon as the channel becomes usable.
 * - `failed` rows are retried with a bounded policy: at most MAX_ATTEMPTS
 *   attempts, never closer together than RETRY_INTERVAL_MS.
 * - Retries UPDATE the existing row (status/error/recipient/attempt_count/
 *   last_attempt_at); only the first attempt INSERTs.
 * - `job_alerts.last_sent_at` only advances when something was actually sent.
 */
import { alertChannelStatus, sendEmail, sendWhatsApp, type SendResult } from "./notify.server";

/** Canonical public site URL, without a trailing slash. */
export function siteUrl(): string {
  const raw = process.env["PUBLIC_SITE_URL"]?.trim();
  const base = raw && raw.length > 0 ? raw : "https://syndeocare.ai";
  return base.replace(/\/+$/, "");
}

/** Escape text before interpolating it into HTML (also attribute-safe). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only ever emit our own absolute http(s) links into href attributes. */
export function safeHref(url: string): string {
  return /^https?:\/\//i.test(url) ? escapeHtml(url) : escapeHtml(siteUrl());
}

export const MAX_ATTEMPTS = 5;
export const RETRY_INTERVAL_MS = 15 * 60 * 1000;
/** A claim (`status = 'processing'`) older than this is considered abandoned. */
export const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000;

/** Internal dispatcher failure; the HTTP layer turns this into a generic 500. */
export class DispatchError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "DispatchError";
  }
}

type Alert = {
  id: string;
  user_id: string;
  specialty_id: string | null;
  country: string | null;
  city: string | null;
  employment_type: string | null;
  channel: string;
  whatsapp_phone: string | null;
  last_sent_at: string | null;
};

type Job = {
  id: string;
  slug: string | null;
  title: string;
  city: string;
  country: string;
  specialty_id: string | null;
  employment_type: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  created_at: string;
};

type Shift = {
  id: string;
  title: string;
  city: string;
  country: string;
  specialty_id: string | null;
  hourly_rate: number;
  currency: string;
  starts_at: string;
  created_at: string;
};

export type DeliveryRow = {
  id: string;
  status: string;
  attempt_count: number | null;
  last_attempt_at: string | null;
};

export type DispatchSummary = {
  configured: { email: boolean; whatsapp: boolean };
  alerts: number;
  matched: number;
  sent: number;
  skipped: number;
  failed: number;
  retried: number;
};

/**
 * Decide whether a (alert, listing, channel) pair should be attempted now.
 * Pure + exported so the retry policy is testable without a provider.
 */
export function shouldAttempt(
  existing: DeliveryRow | undefined,
  channelConfigured: boolean,
  now: number,
): boolean {
  if (!existing) return true;
  if (existing.status === "sent") return false;
  if (existing.status === "not_configured") return channelConfigured;
  const last = existing.last_attempt_at ? Date.parse(existing.last_attempt_at) : 0;
  // A row another run is currently working on: only recover abandoned claims.
  if (existing.status === "processing") return now - last >= PROCESSING_TIMEOUT_MS;
  // failed (or any other non-terminal state): bounded backoff
  const attempts = existing.attempt_count ?? 1;
  if (attempts >= MAX_ATTEMPTS) return false;
  return now - last >= RETRY_INTERVAL_MS;
}

function jobMatches(alert: Alert, job: Job) {
  if (alert.specialty_id && alert.specialty_id !== job.specialty_id) return false;
  if (alert.country && alert.country !== job.country) return false;
  if (alert.city && !job.city.includes(alert.city)) return false;
  if (alert.employment_type && alert.employment_type !== job.employment_type) return false;
  return true;
}

function shiftMatches(alert: Alert, shift: Shift) {
  if (alert.employment_type && alert.employment_type !== "shift") return false;
  if (alert.specialty_id && alert.specialty_id !== shift.specialty_id) return false;
  if (alert.country && alert.country !== shift.country) return false;
  if (alert.city && !shift.city.includes(alert.city)) return false;
  return true;
}

function num(v: number) {
  return new Intl.NumberFormat("ar-EG-u-nu-latn", { maximumFractionDigits: 0 }).format(v);
}

export function jobUrl(job: Pick<Job, "id" | "slug">) {
  return `${siteUrl()}/jobs/${job.slug && job.slug.trim() ? job.slug : job.id}`;
}

export function shiftUrl(shift: Pick<Shift, "id">) {
  return `${siteUrl()}/shifts/${shift.id}`;
}

function jobBody(job: Job) {
  const url = jobUrl(job);
  return {
    subject: `فرصة جديدة تناسبك: ${job.title}`,
    text:
      `فرصة جديدة على SyndeoCare\n\n${job.title}\n${job.city}، ${job.country}\n` +
      `الراتب: ${num(job.salary_min)} – ${num(job.salary_max)} ${job.currency}\n\n${url}`,
    url,
  };
}

function shiftBody(shift: Shift) {
  const url = shiftUrl(shift);
  return {
    subject: `مناوبة جديدة تناسبك: ${shift.title}`,
    text:
      `مناوبة جديدة على SyndeoCare\n\n${shift.title}\n${shift.city}، ${shift.country}\n` +
      `الأجر بالساعة: ${num(shift.hourly_rate)} ${shift.currency}\n\n${url}`,
    url,
  };
}

/** Build the HTML email. All listing-derived content is escaped. */
export function html(title: string, text: string, url: string) {
  return `<!doctype html><html lang="ar" dir="rtl"><body style="background:#ffffff;font-family:Arial,sans-serif;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 12px">${escapeHtml(title)}</h2>
  <p style="white-space:pre-line;line-height:1.7">${escapeHtml(text)}</p>
  <p><a href="${safeHref(url)}" style="display:inline-block;background:#0e7490;color:#ffffff;padding:10px 18px;border-radius:10px;text-decoration:none">عرض التفاصيل</a></p>
  <p style="color:#64748b;font-size:12px">SyndeoCare — منصة التوظيف الطبي</p>
</body></html>`;
}

/** Every DB read/write is fail-closed: a backend error is never "no data". */
function ok<T>(result: { data: T; error: { message: string } | null }, step: string): T {
  if (result.error) {
    console.error(`[alerts] ${step} failed`, result.error.message);
    throw new DispatchError(`alerts_${step}_failed`);
  }
  return result.data;
}

export async function dispatchAlerts(options?: { limit?: number }): Promise<DispatchSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const configured = alertChannelStatus();
  const summary: DispatchSummary = {
    configured,
    alerts: 0,
    matched: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    retried: 0,
  };

  const alerts = (ok(
    await supabaseAdmin
      .from("job_alerts")
      .select("id,user_id,specialty_id,country,city,employment_type,channel,whatsapp_phone,last_sent_at")
      .eq("is_active", true),
    "read_alerts",
  ) ?? []) as Alert[];
  summary.alerts = alerts.length;
  if (!alerts.length) return summary;

  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const [jobRes, shiftRes] = await Promise.all([
    supabaseAdmin
      .from("jobs")
      .select("id,slug,title,city,country,specialty_id,employment_type,salary_min,salary_max,currency,created_at")
      .eq("is_active", true)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 200),
    supabaseAdmin
      .from("shifts")
      .select("id,title,city,country,specialty_id,hourly_rate,currency,starts_at,created_at")
      .eq("status", "open")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 200),
  ]);
  const jobs = (ok(jobRes, "read_jobs") ?? []) as Job[];
  const shifts = (ok(shiftRes, "read_shifts") ?? []) as Shift[];

  // A failed read here would look like "nothing delivered yet" and resend
  // everything, so it must abort before any provider call.
  const deliveredRows = ok(
    await supabaseAdmin
      .from("alert_deliveries")
      .select("id,alert_id,job_id,shift_id,channel,status,attempt_count,last_attempt_at")
      .in("alert_id", alerts.map((a) => a.id)),
    "read_deliveries",
  ) ?? [];

  const key = (alertId: string, jobId: string | null, shiftId: string | null, channel: string) =>
    `${alertId}:${jobId ?? ""}:${shiftId ?? ""}:${channel}`;

  const existingByKey = new Map<string, DeliveryRow>();
  for (const row of deliveredRows as Array<
    DeliveryRow & { alert_id: string; job_id: string | null; shift_id: string | null; channel: string }
  >) {
    existingByKey.set(key(row.alert_id, row.job_id, row.shift_id, row.channel), {
      id: row.id,
      status: row.status,
      attempt_count: row.attempt_count,
      last_attempt_at: row.last_attempt_at,
    });
  }

  const now = Date.now();

  for (const alert of alerts) {
    const channelConfigured = alert.channel === "whatsapp" ? configured.whatsapp : configured.email;

    let recipient: string | null = null;
    if (alert.channel === "whatsapp") {
      recipient = alert.whatsapp_phone;
    } else {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(alert.user_id);
      if (authError) {
        console.error("[alerts] read_recipient failed", authError.message);
        throw new DispatchError("alerts_read_recipient_failed");
      }
      recipient = authUser?.user?.email ?? null;
    }

    const pending: Array<{
      jobId: string | null;
      shiftId: string | null;
      subject: string;
      text: string;
      url: string;
      existing: DeliveryRow | undefined;
    }> = [];

    for (const job of jobs) {
      if (!jobMatches(alert, job)) continue;
      const existing = existingByKey.get(key(alert.id, job.id, null, alert.channel));
      if (!shouldAttempt(existing, channelConfigured, now)) continue;
      pending.push({ jobId: job.id, shiftId: null, existing, ...jobBody(job) });
    }
    for (const shift of shifts) {
      if (!shiftMatches(alert, shift)) continue;
      const existing = existingByKey.get(key(alert.id, null, shift.id, alert.channel));
      if (!shouldAttempt(existing, channelConfigured, now)) continue;
      pending.push({ jobId: null, shiftId: shift.id, existing, ...shiftBody(shift) });
    }

    summary.matched += pending.length;
    let sentForAlert = 0;

    for (const item of pending.slice(0, 10)) {
      const stamp = new Date().toISOString();

      // --- Atomic claim -------------------------------------------------
      // Nothing is sent before this run owns the row. The partial unique
      // indexes plus the compare-and-set guard mean two concurrent cron runs
      // can never both reach the provider for the same (alert, listing,
      // channel) pair. No transaction is held across the provider call.
      let deliveryId: string;
      if (item.existing) {
        const previous = item.existing;
        let claim = supabaseAdmin
          .from("alert_deliveries")
          .update({
            status: "processing",
            attempt_count: (previous.attempt_count ?? 1) + 1,
            last_attempt_at: stamp,
          } as never)
          .eq("id", previous.id)
          .eq("status", previous.status);
        claim =
          previous.attempt_count === null
            ? claim.is("attempt_count", null)
            : claim.eq("attempt_count", previous.attempt_count);
        const claimed = ok(await claim.select("id"), "claim_delivery") ?? [];
        if (!claimed.length) {
          // Another concurrent run owns this attempt.
          summary.skipped += 1;
          continue;
        }
        summary.retried += 1;
        deliveryId = previous.id;
      } else {
        const inserted = await supabaseAdmin
          .from("alert_deliveries")
          .insert({
            alert_id: alert.id,
            job_id: item.jobId,
            shift_id: item.shiftId,
            channel: alert.channel,
            recipient,
            status: "processing",
            attempt_count: 1,
            last_attempt_at: stamp,
          } as never)
          .select("id")
          .single();
        if (inserted.error) {
          if ((inserted.error as { code?: string }).code === "23505") {
            // Another concurrent run inserted the same claim first.
            summary.skipped += 1;
            continue;
          }
          console.error("[alerts] claim_delivery failed", inserted.error.message);
          throw new DispatchError("alerts_claim_delivery_failed");
        }
        deliveryId = (inserted.data as { id: string }).id;
      }

      // --- Provider send ------------------------------------------------
      let result: SendResult;
      if (!recipient) {
        result = { status: "failed", error: "missing_recipient" };
      } else if (alert.channel === "whatsapp") {
        result = await sendWhatsApp({ to: recipient, text: item.text, requireTemplate: true });
      } else {
        result = await sendEmail({
          to: recipient,
          subject: item.subject,
          text: item.text,
          html: html(item.subject, item.text, item.url),
        });
      }

      // --- Finalize -----------------------------------------------------
      // If persistence fails after a real send, the run fails loudly instead
      // of reporting success: the claim row stays `processing` and is only
      // retried after PROCESSING_TIMEOUT_MS, so no blind immediate resend.
      const finalStamp = new Date().toISOString();
      const { error: finalError } = await supabaseAdmin
        .from("alert_deliveries")
        .update({
          status: result.status,
          error: result.error ? sanitizeProviderError(result.error) : null,
          recipient,
          last_attempt_at: finalStamp,
          ...(result.status === "sent" ? { sent_at: finalStamp } : {}),
        } as never)
        .eq("id", deliveryId);
      if (finalError) {
        console.error(
          `[alerts] persist_delivery failed after provider status=${result.status}`,
          finalError.message,
        );
        throw new DispatchError("alerts_persist_delivery_failed");
      }

      if (result.status === "sent") {
        summary.sent += 1;
        sentForAlert += 1;
      } else if (result.status === "failed") {
        summary.failed += 1;
      } else {
        summary.skipped += 1;
      }
    }

    // Only a real delivery advances the alert's "last sent" timestamp. This is
    // display state: `alert_deliveries` remains the source of truth, so a
    // failure here cannot cause a duplicate send.
    if (sentForAlert > 0) {
      const { error: stampError } = await supabaseAdmin
        .from("job_alerts")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", alert.id);
      if (stampError) {
        console.error("[alerts] update_last_sent_at failed", stampError.message);
        throw new DispatchError("alerts_update_last_sent_at_failed");
      }
    }
  }

  return summary;
}
