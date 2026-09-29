import { createServerFn } from "@tanstack/react-start";

/**
 * يعيد معرّف عميل جوجل (Client ID) لاستخدامه في Google One Tap على الويب.
 * المعرّف قيمة عامة بطبيعته (يظهر في صفحات جوجل)، لكنه محفوظ كسرّ
 * لتوحيد الإدارة؛ هذه الدالة تنشره للواجهة فقط.
 */
export const getGoogleOneTapClientId = createServerFn({ method: "GET" }).handler(
  async () => {
    const id = process.env["GOOGLE_OAUTH_CLIENT_ID"];
    return id && id.length > 0 ? id : null;
  },
);
