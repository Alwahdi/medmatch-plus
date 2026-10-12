import { afterEach, describe, expect, it, vi } from "vitest";
import { subscriptionAllowsAccess, subscriptionLifecycle } from "./facility.shared";

describe("continuing free facility access", () => {
  afterEach(() => vi.useRealTimers());
  it("continues after 30 days for an existing facility", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T00:00:00Z"));
    const started = Date.parse("2026-09-01T00:00:00Z");
    const day30 = new Date(started + 30 * 86400000).toISOString();
    const state = subscriptionLifecycle({ status: "trialing", ends_at: day30 }, true);
    expect(state).toBe("active");
    expect(subscriptionAllowsAccess(state)).toBe(true);
  });
  it("does not expire other active free accounts", () => {
    expect(subscriptionAllowsAccess(subscriptionLifecycle({ status: "active", ends_at: "2020-01-01T00:00:00Z" }))).toBe(true);
  });
  it("does not activate a suspended account", () => {
    expect(subscriptionAllowsAccess(subscriptionLifecycle({ status: "cancelled", ends_at: "2099-01-01T00:00:00Z" }))).toBe(false);
  });
  it("does not fabricate access for a missing record", () => {
    expect(subscriptionAllowsAccess(subscriptionLifecycle(null))).toBe(false);
  });
});