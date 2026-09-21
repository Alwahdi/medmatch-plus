import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, space } from "@/lib/theme";

/**
 * Form screens: keeps the focused input above the keyboard on both platforms,
 * lets the user scroll/tap while the keyboard is open, and dismisses on
 * interactive drag the way native apps do.
 */
export function FormScreen({
  children,
  footer,
  contentStyle,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: ScrollViewProps["contentContainerStyle"];
}) {
  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          <Pressable accessible={false} onPress={Keyboard.dismiss}>
            {children}
          </Pressable>
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: 40, gap: space.lg },
  footer: { paddingHorizontal: space.gutter, paddingBottom: 10, paddingTop: space.sm, backgroundColor: colors.bg },
});
