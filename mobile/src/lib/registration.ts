export type RegistrationRole = "professional" | "facility";

/** UI availability only; database roles remain authoritative. */
export function canRegisterRole(platform: string, role: RegistrationRole) {
  return platform !== "ios" || role === "professional";
}

export function canSaveFacilityProfile(platform: string, existingFacilityId?: string | null) {
  return platform !== "ios" || Boolean(existingFacilityId);
}
