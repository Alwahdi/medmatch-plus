import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Phase 67 — public contact submission.
 *
 * The browser never calls the privileged contact RPC directly; it posts here
 * and the server performs the trusted, service-role-only insert. CSRF is
 * already enforced globally for server functions in src/start.ts.
 */
const contactInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(10).max(2000),
  // Honeypot: real users never see or fill this field.
  company: z.string().max(200).optional().default(""),
  // Milliseconds the form stayed open before submitting.
  elapsedMs: z.number().int().nonnegative().optional().default(0),
});

export type ContactResult = "ok" | "rate_limited" | "invalid";

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactInput.parse(input))
  .handler(async ({ data }): Promise<{ result: ContactResult }> => {
    // Bots fill hidden fields and submit instantly. Both look like success so
    // the anti-spam behaviour is not discoverable from outside.
    if (data.company.trim().length > 0 || data.elapsedMs < 800) {
      return { result: "ok" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: outcome, error } = await supabaseAdmin.rpc("submit_contact_message_internal", {
      _name: data.name,
      _email: data.email,
      _message: data.message,
      _subject: data.subject,
    });

    if (error) {
      // Server-side observability only; the browser gets a generic failure.
      console.error("contact submission failed", error.message);
      throw new Error("contact_failed");
    }

    if (outcome === "rate_limited") return { result: "rate_limited" };
    if (outcome === "ok" || outcome === "duplicate") return { result: "ok" };
    return { result: "invalid" };
  });
