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
  const webEnabled = Boolean(keys.publicKey && keys.privateKey);

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
  const { data: subs, error: subsError } = webEnabled
    ? await supabase.from("push_subscriptions").select("id,user_id,endpoint,p256dh,auth").in("user_id", userIds)
    : { data: [] as (Sub & { user_id: string })[], error: null };
  if (subsError) throw subsError;
  const mobile = await sendExpoPush(pending, userIds);

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
          keys as { subject: string; publicKey: string; privateKey: string },
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

  return { sent, mobileSent: mobile.sent, pruned: dead.length + mobile.pruned, notifications: pending.length };
}

type Pending = { id: string; user_id: string; title_ar: string | null; title_en: string | null; body_ar: string | null; body_en: string | null; link: string | null; type: string | null };

/** Sends to native app devices through Expo's push service (no private message text). */
async function sendExpoPush(pending: Pending[], userIds: string[]) {
  const supabase = supabaseAdmin;
  const { data: tokens, error } = await supabase.from("mobile_push_tokens").select("id,user_id,token").in("user_id", userIds);
  if (error) { console.error("[push] mobile tokens", error.message); return { sent: 0, pruned: 0 }; }
  if (!tokens?.length) return { sent: 0, pruned: 0 };
  const messages: { to: string; tokenId: string; title: string; body: string; sound: string; data: Record<string, string> }[] = [];
  for (const n of pending) {
    for (const t of tokens.filter((x) => x.user_id === n.user_id)) {
      messages.push({ to: t.token, tokenId: t.id, title: n.title_ar || n.title_en || "SyndeoCare", body: n.body_ar || n.body_en || "", sound: "default", data: { link: n.link || "/notifications", id: n.id } });
    }
  }
  let sent = 0;
  const dead = new Set<string>();
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(chunk.map(({ tokenId: _t, ...m }) => m)),
      });
      const json = (await res.json()) as { data?: { status: string; details?: { error?: string } }[] };
      json.data?.forEach((r, idx) => {
        if (r.status === "ok") sent += 1;
        else if (r.details?.error === "DeviceNotRegistered") dead.add(chunk[idx]!.tokenId);
      });
    } catch (e) {
      console.error("[push] expo send failed", e);
    }
  }
  if (dead.size) await supabase.from("mobile_push_tokens").delete().in("id", [...dead]);
  return { sent, pruned: dead.size };
}
