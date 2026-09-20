import { supabase } from "@/integrations/supabase/client";

/**
 * إثبات أن الجلسة الحالية نتجت عن رابط استعادة كلمة المرور فعلاً.
 * لا نخزّن أي رمز أو كلمة مرور — فقط علامة قصيرة العمر في sessionStorage
 * تُكتب حصراً عند حدث PASSWORD_RECOVERY القادم من رابط الاستعادة.
 */
const KEY = "syndeocare.recovery-proof";
const MAX_AGE_MS = 10 * 60 * 1000;
/** مهلة صغيرة نتجاهل خلالها حدث SIGNED_IN المصاحب لنفس تدفق الاستعادة. */
const SETTLE_MS = 5000;

function now() {
  return Date.now();
}

export function markRecoveryProof() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, String(now()));
}

export function readRecoveryProofAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  const at = Number(raw);
  if (!Number.isFinite(at) || now() - at > MAX_AGE_MS) {
    window.sessionStorage.removeItem(KEY);
    return null;
  }
  return at;
}

export function hasRecoveryProof(): boolean {
  return readRecoveryProofAt() !== null;
}

export function clearRecoveryProof() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}

let installed = false;

/** يُثبَّت مرة واحدة على مستوى التطبيق، مبكراً قدر الإمكان. */
export function installRecoveryProofWatcher() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      markRecoveryProof();
      return;
    }
    if (event === "SIGNED_OUT") {
      clearRecoveryProof();
      return;
    }
    if (event === "SIGNED_IN") {
      // دخول عادي يُلغي الإثبات، لكن لا نُلغي الحدث المصاحب لنفس تدفق الاستعادة.
      const at = readRecoveryProofAt();
      if (at !== null && now() - at > SETTLE_MS) clearRecoveryProof();
    }
  });
}

/** ينتظر ظهور علامة الاستعادة (تبديل الرمز التلقائي قد يسبق تحميل الصفحة أو يليها بقليل). */
export async function waitForRecoveryProof(timeoutMs = 5000): Promise<boolean> {
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    if (hasRecoveryProof()) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return hasRecoveryProof();
}
