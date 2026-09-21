import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii, shadow } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

export function Screen({
  children,
  scroll = true,
  refreshControl,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshControl?: React.ReactElement;
  padded?: boolean;
}) {
  const inner = padded ? <View style={{ padding: 16, gap: 12 }}>{children}</View> : children;
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          {...(refreshControl ? { refreshControl } : {})}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{inner}</View>
      )}
    </SafeAreaView>
  );
}

export function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.title}>{children}</Text>
      {sub ? <Text style={styles.muted}>{sub}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, shadow, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  small,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
}) {
  const palette: Record<string, { bg: string; fg: string; border: string }> = {
    primary: { bg: colors.primary, fg: "#FFFFFF", border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.border },
    ghost: { bg: "transparent", fg: colors.primary, border: "transparent" },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  };
  const p = palette[variant] ?? palette["primary"]!;
  const isOff = Boolean(disabled) || Boolean(loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isOff, busy: Boolean(loading) }}
      onPress={isOff ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          opacity: isOff ? 0.55 : pressed ? 0.85 : 1,
          minHeight: small ? 40 : 48,
          paddingHorizontal: small ? 12 : 16,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <Text style={[styles.buttonLabel, { color: p.fg, fontSize: small ? 14 : 16 }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, error ? { borderColor: colors.danger } : null]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "primary" }) {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  };
  const t = tones[tone] ?? tones["neutral"]!;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={{ color: t.fg, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border },
      ]}
    >
      <Text style={{ color: active ? "#FFFFFF" : colors.text, fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ children, gap = 8, wrap }: { children: React.ReactNode; gap?: number; wrap?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap, flexWrap: wrap ? "wrap" : "nowrap" }}>
      {children}
    </View>
  );
}

export function Loading() {
  const { t } = useI18n();
  return (
    <View style={{ padding: 32, alignItems: "center", gap: 8 }}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{t("loading")}</Text>
    </View>
  );
}

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <Card style={{ alignItems: "center", gap: 10 }}>
      <Text style={[styles.muted, { textAlign: "center" }]}>{text}</Text>
      {action}
    </Card>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <Card style={{ gap: 10, borderColor: colors.dangerSoft }}>
      <Text style={{ color: colors.danger, fontWeight: "700" }}>{t("errorTitle")}</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry ? <Button label={t("retry")} variant="secondary" small onPress={onRetry} /> : null}
    </Card>
  );
}

export function KeyValue({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={styles.muted}>{k}</Text>
      <Text style={[styles.body, { flexShrink: 1, textAlign: "end" as unknown as "right" }]}>{v}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "800", color: colors.text, writingDirection: "auto" },
  body: { fontSize: 15, color: colors.text, writingDirection: "auto" },
  muted: { fontSize: 14, color: colors.textMuted, writingDirection: "auto" },
  label: { fontSize: 14, fontWeight: "600", color: colors.text },
  error: { fontSize: 13, color: colors.danger },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  button: {
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: { fontWeight: "700" },
  input: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.text,
    textAlign: "auto" as unknown as "auto",
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  chip: {
    paddingHorizontal: 12,
    minHeight: 36,
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
