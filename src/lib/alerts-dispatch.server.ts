/**
 * Job/shift alert dispatcher.
 *
 * Finds new listings that match each active alert, sends them through the
 * configured channel (email / WhatsApp) and records every attempt in
 * `alert_deliveries` — including attempts skipped because the channel is not
 * configured yet, so nothing is ever silently lost or duplicated.
 */
import { channelStatus, sendEmail, sendWhatsApp, type SendResult } from "./notify.server";

const SITE_URL = process.env["PUBLIC_SITE_URL"] ?? "https://medmatch-plus.lovable.app";

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

export type DispatchSummary = {
  configured: { email: boolean; whatsapp: boolean };
  alerts: number;
  matched: number;
  sent: number;
  skipped: number;
  failed: number;
};

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

function jobBody(job: Job) {
  return {
    subject: `فرصة جديدة تناسبك: ${job.title}`,
    text:
      `فرصة جديدة على SyndeoCare\n\n${job.title}\n${job.city}، ${job.country}\n` +
      `الراتب: ${num(job.salary_min)} – ${num(job.salary_max)} ${job.currency}\n\n` +
      `${SITE_URL}/jobs/${job.id}`,
    url: `${SITE_URL}/jobs/${job.id}`,
  };
}

function shiftBody(shift: Shift) {
  return {
    subject: `مناوبة جديدة تناسبك: ${shift.title}`,
    text:
      `مناوبة جديدة على SyndeoCare\n\n${shift.title}\n${shift.city}، ${shift.country}\n` +
      `الأجر بالساعة: ${num(shift.hourly_rate)} ${shift.currency}\n\n${SITE_URL}/shifts`,
    url: `${SITE_URL}/shifts`,
  };
}

function html(title: string, text: string, url: string) {
  return `<!doctype html><html lang="ar" dir="rtl"><body style="background:#ffffff;font-family:Arial,sans-serif;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 12px">${title}</h2>
  <p style="white-space:pre-line;line-height:1.7">${text}</p>
  <p><a href="${url}" style="display:inline-block;background:#0e7490;color:#ffffff;padding:10px 18px;border-radius:10px;text-decoration:none">عرض التفاصيل</a></p>
  <p style="color:#64748b;font-size:12px">SyndeoCare — منصة التوظيف الطبي</p>
</body></html>`;
}

export async function dispatchAlerts(options?: { limit?: number }): Promise<DispatchSummary> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const configured = channelStatus();
  const summary: DispatchSummary = {
    configured,
    alerts: 0,
    matched: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  const { data: alertRows } = await supabaseAdmin
    .from("job_alerts")
    .select("id,user_id,specialty_id,country,city,employment_type,channel,whatsapp_phone,last_sent_at")
    .eq("is_active", true);
  const alerts = (alertRows ?? []) as Alert[];
  summary.alerts = alerts.length;
  if (!alerts.length) return summary;

  const since = new Date(Date.now() - 14 * 86400000).toISOString();
  const [{ data: jobRows }, { data: shiftRows }] = await Promise.all([
    supabaseAdmin
      .from("jobs")
      .select("id,title,city,country,specialty_id,employment_type,salary_min,salary_max,currency,created_at")
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
  const jobs = (jobRows ?? []) as Job[];
  const shifts = (shiftRows ?? []) as Shift[];

  const { data: deliveredRows } = await supabaseAdmin
    .from("alert_deliveries")
    .select("alert_id,job_id,shift_id")
    .in("alert_id", alerts.map((a) => a.id));
  const delivered = new Set(
    (deliveredRows ?? []).map((d) => `${d.alert_id}:${d.job_id ?? ""}:${(d as { shift_id?: string | null }).shift_id ?? ""}`),
  );

  for (const alert of alerts) {
    let recipient: string | null = null;
    if (alert.channel === "whatsapp") {
      recipient = alert.whatsapp_phone;
    } else {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(alert.user_id);
      recipient = authUser?.user?.email ?? null;
    }

    const pending: Array<{ jobId: string | null; shiftId: string | null; subject: string; text: string; url: string }> = [];

    for (const job of jobs) {
      if (!jobMatches(alert, job)) continue;
      if (delivered.has(`${alert.id}:${job.id}:`)) continue;
      const b = jobBody(job);
      pending.push({ jobId: job.id, shiftId: null, ...b });
    }
    for (const shift of shifts) {
      if (!shiftMatches(alert, shift)) continue;
      if (delivered.has(`${alert.id}::${shift.id}`)) continue;
      const b = shiftBody(shift);
      pending.push({ jobId: null, shiftId: shift.id, ...b });
    }

    summary.matched += pending.length;

    for (const item of pending.slice(0, 10)) {
      let result: SendResult;
      if (!recipient) {
        result = { status: "failed", error: "missing_recipient" };
      } else if (alert.channel === "whatsapp") {
        result = await sendWhatsApp({ to: recipient, text: item.text });
      } else {
        result = await sendEmail({
          to: recipient,
          subject: item.subject,
          text: item.text,
          html: html(item.subject, item.text, item.url),
        });
      }

      if (result.status === "sent") summary.sent += 1;
      else if (result.status === "failed") summary.failed += 1;
      else summary.skipped += 1;

      await supabaseAdmin.from("alert_deliveries").insert({
        alert_id: alert.id,
        job_id: item.jobId,
        shift_id: item.shiftId,
        channel: alert.channel,
        recipient,
        status: result.status,
        error: result.error ?? null,
      } as never);
    }

    if (pending.length) {
      await supabaseAdmin
        .from("job_alerts")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", alert.id);
    }
  }

  return summary;
}
