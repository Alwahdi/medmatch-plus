/**
 * Notification providers (email + WhatsApp).
 *
 * Both channels are fully implemented but stay dormant until the matching
 * environment secrets are configured. Until then every send resolves with
 * `{ status: "not_configured" }` so nothing crashes and the delivery log
 * records exactly why a message was not sent.
 *
 * Email (Resend-compatible HTTP API):
 *   RESEND_API_KEY     - provider API key
 *   ALERTS_FROM_EMAIL  - verified sender, e.g. "SyndeoCare <alerts@example.com>"
 *
 * WhatsApp (Meta Cloud API compatible):
 *   WHATSAPP_TOKEN            - permanent access token
 *   WHATSAPP_PHONE_NUMBER_ID  - sender phone number id
 *   WHATSAPP_TEMPLATE_NAME    - optional approved template name (defaults to plain text)
 */

export type SendStatus = "sent" | "failed" | "not_configured";

export type SendResult = {
  status: SendStatus;
  error?: string;
};

export type ChannelStatus = {
  email: boolean;
  whatsapp: boolean;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function channelStatus(): ChannelStatus {
  return {
    email: Boolean(env("RESEND_API_KEY") && env("ALERTS_FROM_EMAIL")),
    whatsapp: Boolean(env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_NUMBER_ID")),
  };
}

/**
 * Readiness for proactive (business-initiated) job/shift alerts.
 *
 * Outside the 24h customer service window WhatsApp only delivers approved
 * templates, so plain text cannot be promised: the channel counts as ready
 * only when an approved template name is configured too.
 */
export function alertChannelStatus(): ChannelStatus {
  const base = channelStatus();
  return {
    email: base.email,
    whatsapp: base.whatsapp && Boolean(env("WHATSAPP_TEMPLATE_NAME")),
  };
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = env("RESEND_API_KEY");
  const from = env("ALERTS_FROM_EMAIL");
  if (!apiKey || !from) return { status: "not_configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { status: "failed", error: `email ${res.status}: ${body.slice(0, 300)}` };
    }
    return { status: "sent" };
  } catch (e) {
    return { status: "failed", error: `email: ${(e as Error).message}` };
  }
}

export async function sendWhatsApp(input: { to: string; text: string }): Promise<SendResult> {
  const token = env("WHATSAPP_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) return { status: "not_configured" };

  const to = input.to.replace(/[^\d]/g, "");
  const templateName = env("WHATSAPP_TEMPLATE_NAME");
  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: env("WHATSAPP_TEMPLATE_LANG") ?? "ar" },
          components: [{ type: "body", parameters: [{ type: "text", text: input.text }] }],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body: input.text },
      };

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      return { status: "failed", error: `whatsapp ${res.status}: ${body.slice(0, 300)}` };
    }
    return { status: "sent" };
  } catch (e) {
    return { status: "failed", error: `whatsapp: ${(e as Error).message}` };
  }
}
