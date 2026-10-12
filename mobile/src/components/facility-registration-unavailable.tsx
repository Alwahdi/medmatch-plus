import React from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { space } from "@/lib/theme";

export function FacilityRegistrationUnavailable() {
  const { lang } = useI18n();
  const { signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(false);
  const returnToLogin = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await signOut();
      router.replace("/sign-in");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return <Screen>
    <ScreenHeader title={lang === "ar" ? "حسابات المنشآت القائمة" : "Existing facility accounts"} />
    <View style={{ gap: space.lg }}>
      <Text style={ui.body}>{lang === "ar" ? "إنشاء حساب منشأة جديد غير متاح في تطبيق iOS. يمكنك تسجيل الدخول بحساب منشأتك القائم واستخدامه." : "New facility registration is not available in the iOS app. You can sign in and use your existing facility account."}</Text>
      {error ? <Text style={ui.muted}>{lang === "ar" ? "تعذر تسجيل الخروج. حاول مرة أخرى." : "Could not sign out. Please try again."}</Text> : null}
      <Button label={lang === "ar" ? "العودة إلى تسجيل الدخول" : "Back to sign in"} onPress={() => void returnToLogin()} loading={busy} />
    </View>
  </Screen>;
}
