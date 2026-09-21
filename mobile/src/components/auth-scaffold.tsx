import React from "react";
import { I18nManager, Pressable, Text, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { FormScreen } from "@/components/keyboard";
import { Brand } from "@/components/brand";
import { styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { colors, fonts, radii } from "@/lib/theme";

/**
 * الهيكل الموحد لشاشات المصادقة: شعار مدمج، شريط خطوات مترابط مع تسميته،
 * زر رجوع خارج المحتوى، عنوان واحد واضح، ومساحة آمنة فوق لوحة المفاتيح.
 */
export function AuthScaffold({
  title,
  sub,
  step,
  totalSteps,
  onBack,
  children,
}: {
  title: string;
  sub?: string;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const rtl = I18nManager.isRTL;

  return (
    <FormScreen contentStyle={{ gap: 18, paddingTop: 18 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
        <Brand compact />
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("back")}
            onPress={onBack}
            hitSlop={8}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              minHeight: 44,
              paddingHorizontal: 12,
              borderRadius: radii.pill,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <ArrowLeft size={16} color={colors.text} strokeWidth={2.4} style={{ transform: [{ scaleX: rtl ? -1 : 1 }] }} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.text }}>{t("back")}</Text>
          </Pressable>
        ) : null}
      </View>

      {step != null && totalSteps != null ? (
        <View style={{ gap: 7 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: i < step ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          <Text style={ui.muted}>
            {t("stepOf").replace("{a}", String(step)).replace("{b}", String(totalSteps))}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: 5 }}>
        <Text style={ui.title}>{title}</Text>
        {sub ? <Text style={ui.muted}>{sub}</Text> : null}
      </View>

      {children}
    </FormScreen>
  );
}
