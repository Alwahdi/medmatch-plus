/**
 * Single validity rule for verification evidence, mirroring the database
 * helpers `private.pro_verification_evidence_ok` / `facility_verification_evidence_ok`:
 * a document counts while `expiry_date IS NULL OR expiry_date >= current_date`
 * (valid through the expiry day itself).
 *
 * Review status (approved/rejected) and evidence validity are separate:
 * time never rewrites an admin review decision.
 */

export const EXPIRY_SOON_DAYS = 30;

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Days until expiry; null when there is no expiry date. */
export function daysUntilExpiry(expiry: string | null | undefined): number | null {
  const d = toDate(expiry);
  if (!d) return null;
  return Math.round((d.getTime() - todayUtc().getTime()) / 86_400_000);
}

export function isExpired(expiry: string | null | undefined): boolean {
  const days = daysUntilExpiry(expiry);
  return days !== null && days < 0;
}

export function isExpiringSoon(expiry: string | null | undefined): boolean {
  const days = daysUntilExpiry(expiry);
  return days !== null && days >= 0 && days <= EXPIRY_SOON_DAYS;
}

/** Approved AND unexpired — the only shape that supports a verified badge. */
export function isValidEvidence(doc: { status: string; expiry_date: string | null }): boolean {
  return doc.status === "approved" && !isExpired(doc.expiry_date);
}

export const VALIDITY_TXT = {
  ar: {
    expired: "منتهي الصلاحية",
    expiringSoon: "قارب على الانتهاء",
    requiredExpired: "انتهت صلاحية مستند مطلوب — ارفع مستنداً سارياً لاستعادة التوثيق",
    requiredExpiringSoon: "مستند مطلوب يقارب على الانتهاء — جدّده قبل انتهاء صلاحيته للحفاظ على التوثيق",
  },
  en: {
    expired: "Expired",
    expiringSoon: "Expiring soon",
    requiredExpired: "A required document has expired — upload a valid one to restore verification",
    requiredExpiringSoon: "A required document is expiring soon — renew it to keep your verification",
  },
} as const;
