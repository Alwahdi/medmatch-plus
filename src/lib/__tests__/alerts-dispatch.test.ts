import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  MAX_ATTEMPTS,
  RETRY_INTERVAL_MS,
  escapeHtml,
  html,
  jobUrl,
  shiftUrl,
  shouldAttempt,
  siteUrl,
} from "../alerts-dispatch.server";

const NOW = Date.parse("2026-01-01T12:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("retry policy", () => {
  it("never re-sends a delivered item", () => {
    expect(
      shouldAttempt({ id: "1", status: "sent", attempt_count: 1, last_attempt_at: ago(0) }, true, NOW),
    ).toBe(false);
  });

  it("sends the first attempt", () => {
    expect(shouldAttempt(undefined, true, NOW)).toBe(true);
  });

  it("retries not_configured only once the channel is configured", () => {
    const row = { id: "1", status: "not_configured", attempt_count: 1, last_attempt_at: ago(0) };
    expect(shouldAttempt(row, false, NOW)).toBe(false);
    expect(shouldAttempt(row, true, NOW)).toBe(true);
  });

  it("backs off failed attempts and stops at the max", () => {
    expect(
      shouldAttempt({ id: "1", status: "failed", attempt_count: 1, last_attempt_at: ago(60_000) }, true, NOW),
    ).toBe(false);
    expect(
      shouldAttempt(
        { id: "1", status: "failed", attempt_count: 1, last_attempt_at: ago(RETRY_INTERVAL_MS) },
        true,
        NOW,
      ),
    ).toBe(true);
    expect(
      shouldAttempt(
        { id: "1", status: "failed", attempt_count: MAX_ATTEMPTS, last_attempt_at: ago(86_400_000) },
        true,
        NOW,
      ),
    ).toBe(false);
  });
});

describe("html safety", () => {
  it("escapes malicious listing content", () => {
    const evil = `<img src=x onerror="alert('x')">`;
    const out = html(evil, evil, "https://syndeocare.ai/jobs/abc");
    expect(out).not.toContain("<img");
    expect(out).not.toContain(`onerror="`);
    expect(out).toContain("&lt;img");
    expect(escapeHtml(`"&'`)).toBe("&quot;&amp;&#39;");
  });

  it("rejects non-http hrefs", () => {
    expect(html("t", "t", "javascript:alert(1)")).not.toContain("javascript:");
  });
});

describe("canonical links", () => {
  const prev = process.env["PUBLIC_SITE_URL"];
  beforeEach(() => {
    delete process.env["PUBLIC_SITE_URL"];
  });
  afterEach(() => {
    if (prev === undefined) delete process.env["PUBLIC_SITE_URL"];
    else process.env["PUBLIC_SITE_URL"] = prev;
  });

  it("falls back to syndeocare.ai", () => {
    expect(siteUrl()).toBe("https://syndeocare.ai");
  });

  it("strips trailing slashes", () => {
    process.env["PUBLIC_SITE_URL"] = "https://syndeocare.ai///";
    expect(siteUrl()).toBe("https://syndeocare.ai");
  });

  it("prefers the job slug and links a specific shift", () => {
    expect(jobUrl({ id: "id-1", slug: "nurse-sanaa" })).toBe("https://syndeocare.ai/jobs/nurse-sanaa");
    expect(jobUrl({ id: "id-1", slug: null })).toBe("https://syndeocare.ai/jobs/id-1");
    expect(shiftUrl({ id: "s-1" })).toBe("https://syndeocare.ai/shifts/s-1");
  });
});
