import { describe, expect, it } from "vitest";
import { canRegisterRole, canSaveFacilityProfile } from "./registration";

describe("iOS facility registration", () => {
  it("blocks new iOS facility signup", () => expect(canRegisterRole("ios", "facility")).toBe(false));
  it("keeps iOS professional signup", () => expect(canRegisterRole("ios", "professional")).toBe(true));
  it("keeps Android facility signup", () => expect(canRegisterRole("android", "facility")).toBe(true));
  it("keeps web facility signup", () => expect(canRegisterRole("web", "facility")).toBe(true));
  it("blocks iOS new profile creation", () => {
    expect(canSaveFacilityProfile("ios")).toBe(false);
    expect(canSaveFacilityProfile("ios", null)).toBe(false);
  });
  it("preserves existing iOS facility edits", () => expect(canSaveFacilityProfile("ios", "existing-id")).toBe(true));
  it("keeps Android new profiles", () => expect(canSaveFacilityProfile("android")).toBe(true));
  it("keeps web new profiles", () => expect(canSaveFacilityProfile("web")).toBe(true));
});
