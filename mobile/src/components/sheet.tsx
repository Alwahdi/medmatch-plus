import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { colors, fonts, radii } from "@/lib/theme";
import { styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function Sheet({ visible, title, onClose, children, footer }: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("close")} onPress={onClose} style={{ flex: 1, backgroundColor: colors.overlay }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, maxHeight: "82%" }}>
        <View style={{ alignItems: "center", paddingTop: 10 }}>
          <View style={{ width: 42, height: 4, borderRadius: 999, backgroundColor: colors.border }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: colors.text }}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t("close")} hitSlop={10} onPress={onClose} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <X size={20} color={colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 12, gap: 12 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer ? (
          <SafeAreaView edges={["bottom"]} style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ padding: 14, gap: 8 }}>{footer}</View>
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
      <View style={ui.fill} pointerEvents="none" />
    </Modal>
  );
}
