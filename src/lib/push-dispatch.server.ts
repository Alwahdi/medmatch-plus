import { buildPushPayload } from "@block65/webcrypto-web-push";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Sends browser push notifications for notification rows that have not been
 * pushed yet.
 *
 * Privacy (Phase 101): the push payload never carries private conversation
 * text or attachment names. It carries the notification's own generic title,
 * an optional short body that the database already deemed safe, and the link.
 * Do not widen this without an explicit privacy decision.
 */

const BATCH = 200;

type Sub = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function vapid() {
  return {
    subject: process.env["VAPID_SUBJECT"] ?? "mailto:support@syndeocare.ai",
    publicKey: process.env["VAPID_PUBLIC_KEY"],
    privateKey: process.env["VAPID_PRIVATE_KEY"],
  };
}

export async function dispatchPush() {
  const keys = vapid();
  if (!keys.publicKey || !keys.privateKey) {
    return { skipped: "missing_vapid_keys", sent: 0, pruned: 0, notifications: 0 };
  }

  const supabase = supabaseAdmin;

  const { data: pending, error } = await supabase
    .from("notifications")
    .select("id,user_id,title_ar,title_en,body_ar,body_en,link,type")
    .is("pushed_at", null)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) throw error;
  if (!pending?.length) return { sent: 0, pruned: 0, notifications: 0 };

  const userIds = Array.from(new Set(pending.map((n) => n.user_id)));
  const { data: subs, error: subsError } = await supabase
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")
    .in("user_id", userIds);
  if (subsError) throw subsError;

  const byUser = new Map<string, Sub[]>();
  for (const s of subs ?? []) {
    const list = byUser.get(s.user_id) ?? [];
    list.push(s);
    byUser.set(s.user_id, list);
  }

  let sent = 0;
  const dead: string[] = [];
  const used: string[] = [];

  for (const n of pending) {
    const targets = byUser.get(n.user_id) ?? [];
    for (const sub of targets) {
      const payload = {
        title: n.title_ar || n.title_en || "SyndeoCare",
        body: n.body_ar || n.body_en || "",
        url: n.link || "/notifications",
        tag: n.type ?? "syndeocare",
        lang: "ar",
        dir: "rtl",
      };
      try {
        const req = await buildPushPayload(
          { data: payload, options: { ttl: 60 * 60 * 24, urgency: "normal" } },
          { endpoint: sub.endpoint, expirationTime: null, keys: { auth: sub.auth, p256dh: sub.p256dh } },
          keys,
        );
        const res = await fetch(sub.endpoint, {
          method: req.method,
          headers: req.headers,
          body: req.body as unknown as BodyInit,
        });
        if (res.status === 404 || res.status === 410) {
          dead.push(sub.id);
        } else if (res.ok) {
          sent += 1;
          used.push(sub.id);
        } else {
          console.error("[push] endpoint rejected", res.status);
        }
      } catch (e) {
        console.error("[push] send failed", e);
      }
    }
  }

  const { error: markError } = await supabase
    .from("notifications")
    .update({ pushed_at: new Date().toISOString() })
    .in(
      "id",
      pending.map((n) => n.id),
    );
  if (markError) throw markError;

  if (dead.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", dead);
  }
  if (used.length > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .in("id", Array.from(new Set(used)));
  }

  return { sent, pruned: dead.length, notifications: pending.length };
}
