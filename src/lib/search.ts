/** بحث نصي متسامح: يتجاهل التشكيل واختلاف الألف/الهمزة/التاء المربوطة وحالة الأحرف. */
export function normalizeText(input: string | null | undefined): string {
  return (input ?? "")
    .toString()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "") // تشكيل + تطويل
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

/** true إذا كانت كل كلمات البحث موجودة في أحد الحقول. */
export function matchesQuery(
  haystacks: (string | null | undefined)[],
  query: string | null | undefined,
): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  const hay = haystacks.map(normalizeText).join(" ");
  return q.split(" ").every((word) => hay.includes(word));
}
