import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type RefreshControlProps,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { AlertCircle, ChevronLeft, Eye, EyeOff, Inbox } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radii, shadow } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

export function Screen({ children, scroll = true, refreshControl, padded = true }: {
  children: React.ReactNode; scroll?: boolean; refreshControl?: React.ReactElement<RefreshControlProps>; padded?: boolean;
}) {
  const inner = padded ? <View style={styles.screenInner}>{children}</View> : children;
  return <SafeAreaView edges={["top"]} style={styles.screen}><KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : "height"}>{scroll ? <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"} automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} {...(refreshControl ? { refreshControl } : {})}>{inner}</ScrollView> : <View style={styles.fill}>{inner}</View>}</KeyboardAvoidingView></SafeAreaView>;
}

export function Title({ children, sub, eyebrow }: { children: React.ReactNode; sub?: string; eyebrow?: string }) {
  return <View style={styles.titleWrap}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{children}</Text>{sub ? <Text style={styles.muted}>{sub}</Text> : null}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action}</View>;
}

export function Card({ children, style, elevated = false }: { children: React.ReactNode; style?: ViewStyle; elevated?: boolean }) {
  return <View style={[styles.card, elevated ? shadow : null, style]}>{children}</View>;
}

export function Button({ label, onPress, variant = "primary", disabled, loading, small, icon: Icon }: {
  label: string; onPress?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; disabled?: boolean; loading?: boolean; small?: boolean; icon?: LucideIcon;
}) {
  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryText, border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong },
    ghost: { bg: "transparent", fg: colors.primary, border: "transparent" },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  }[variant];
  const isOff = Boolean(disabled) || Boolean(loading);
  const handlePress = () => { if (Platform.OS !== "web") void Haptics.selectionAsync(); onPress?.(); };
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: isOff, busy: Boolean(loading) }} onPress={isOff ? undefined : handlePress} style={({ pressed }) => [styles.button, { backgroundColor: palette.bg, borderColor: palette.border, opacity: isOff ? .5 : pressed ? .82 : 1, minHeight: small ? 44 : 52, paddingHorizontal: small ? 14 : 18 }]}>{loading ? <ActivityIndicator color={palette.fg} /> : <View style={styles.buttonContent}>{Icon ? <Icon size={18} color={palette.fg} strokeWidth={2.2} /> : null}<Text style={[styles.buttonLabel, { color: palette.fg, fontSize: small ? 13 : 15 }]}>{label}</Text></View>}</Pressable>;
}

export function IconButton({ icon: Icon, label, onPress, tone = "neutral" }: { icon: LucideIcon; label: string; onPress?: () => void; tone?: "neutral" | "primary" }) {
  const fg = tone === "primary" ? colors.primary : colors.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, { opacity: pressed ? .65 : 1 }]}><Icon size={22} color={fg} strokeWidth={2.1} /></Pressable>;
}

export function MenuRow({ icon: Icon, title, subtitle, onPress, tone = "primary" }: { icon: LucideIcon; title: string; subtitle?: string; onPress?: () => void; tone?: "primary" | "accent" | "violet" | "danger" }) {
  const p = tone === "danger" ? { bg: colors.dangerSoft, fg: colors.danger } : tone === "accent" ? { bg: colors.accentSoft, fg: colors.accent } : tone === "violet" ? { bg: colors.brandVioletSoft, fg: colors.brandViolet } : { bg: colors.primarySoft, fg: colors.primary };
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, { opacity: pressed ? .72 : 1 }]}><View style={[styles.menuIcon, { backgroundColor: p.bg }]}><Icon size={21} color={p.fg} strokeWidth={2.1} /></View><View style={styles.menuText}><Text style={styles.menuTitle}>{title}</Text>{subtitle ? <Text style={styles.menuSubtitle} numberOfLines={1}>{subtitle}</Text> : null}</View><ChevronLeft size={19} color={colors.textSubtle} /></Pressable>;
}

export const Field = React.forwardRef<TextInput, TextInputProps & { label?: string; error?: string | null }>(
  function Field({ label, error, ...props }, ref) {
    const { t } = useI18n();
    const isPassword = Boolean(props.secureTextEntry);
    const [revealed, setRevealed] = React.useState(false);
    const ToggleIcon = revealed ? EyeOff : Eye;
    return (
      <View style={styles.field}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.inputWrap}>
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            placeholderTextColor={colors.textSubtle}
            style={[
              styles.input,
              props.multiline ? styles.inputMultiline : null,
              isPassword ? styles.inputWithAction : null,
              error ? styles.inputError : null,
            ]}
            {...props}
            secureTextEntry={isPassword && !revealed}
          />
          {isPassword ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={revealed ? t("hidePassword") : t("showPassword")}
              hitSlop={10}
              onPress={() => setRevealed((v) => !v)}
              style={styles.inputAction}
            >
              <ToggleIcon size={19} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

export function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "primary" }) {
  const t = { neutral: { bg: colors.surfaceMuted, fg: colors.textMuted }, success: { bg: colors.successSoft, fg: colors.success }, warning: { bg: colors.warningSoft, fg: colors.warning }, danger: { bg: colors.dangerSoft, fg: colors.danger }, primary: { bg: colors.primarySoft, fg: colors.primary } }[tone];
  return <View style={[styles.badge, { backgroundColor: t.bg }]}><Text style={[styles.badgeLabel, { color: t.fg }]}>{label}</Text></View>;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(active) }} onPress={onPress} style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.chipLabel, { color: active ? colors.primaryText : colors.text }]}>{label}</Text></Pressable>;
}

export function Row({ children, gap = 8, wrap }: { children: React.ReactNode; gap?: number; wrap?: boolean }) { return <View style={{ flexDirection: "row", alignItems: "center", gap, flexWrap: wrap ? "wrap" : "nowrap" }}>{children}</View>; }

export function Loading({ rows = 3 }: { rows?: number }) { return <View accessibilityLabel="Loading" style={styles.skeletonWrap}>{Array.from({ length: rows }).map((_, i) => <View key={i} style={styles.skeletonCard}><View style={styles.skeletonIcon}/><View style={styles.skeletonLines}><View style={[styles.skeletonLine, { width: "68%" }]}/><View style={[styles.skeletonLine, { width: "42%" }]}/></View></View>)}</View>; }

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) { return <View style={styles.state}><View style={styles.stateIcon}><Inbox size={28} color={colors.primary} /></View><Text style={styles.stateTitle}>{text}</Text>{action}</View>; }

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { const { t } = useI18n(); return <View style={[styles.state, { borderColor: colors.dangerSoft }]}><View style={[styles.stateIcon, { backgroundColor: colors.dangerSoft }]}><AlertCircle size={28} color={colors.danger}/></View><Text style={styles.stateTitle}>{t("errorTitle")}</Text><Text style={styles.muted}>{message}</Text>{onRetry ? <Button label={t("retry")} variant="secondary" small onPress={onRetry}/> : null}</View>; }

export function KeyValue({ k, v }: { k: string; v: string }) { return <View style={styles.keyValue}><Text style={styles.muted}>{k}</Text><Text style={[styles.bodyStrong, styles.keyValueText]}>{v}</Text></View>; }

export const styles = StyleSheet.create({
  fill: { flex: 1 }, screen: { flex: 1, backgroundColor: colors.bg }, screenInner: { paddingHorizontal: 18, paddingTop: 12, gap: 14 }, scrollContent: { paddingBottom: 112 },
  titleWrap: { gap: 3, marginBottom: 2 }, eyebrow: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary, letterSpacing: 0 }, title: { fontFamily: fonts.bold, fontSize: 25, lineHeight: 36, color: colors.text, writingDirection: "auto" }, sectionHeader: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.text, writingDirection: "auto" }, bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text }, muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, color: colors.textMuted, writingDirection: "auto" }, label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text }, error: { fontFamily: fonts.regular, fontSize: 12, color: colors.danger },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }, button: { borderRadius: radii.md, borderWidth: 1, alignItems: "center", justifyContent: "center" }, buttonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, buttonLabel: { fontFamily: fonts.bold }, iconButton: { width: 46, height: 46, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  field: { gap: 7 }, input: { minHeight: 52, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.text, fontFamily: fonts.regular, fontSize: 14, textAlign: "auto" }, inputMultiline: { minHeight: 110, paddingTop: 14, textAlignVertical: "top" }, inputError: { borderColor: colors.danger },
  inputWrap: { position: "relative", justifyContent: "center" }, inputWithAction: { paddingEnd: 52 }, inputAction: { position: "absolute", end: 6, height: 44, width: 44, alignItems: "center", justifyContent: "center" },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill }, badgeLabel: { fontFamily: fonts.semibold, fontSize: 11 }, chip: { paddingHorizontal: 14, minHeight: 42, justifyContent: "center", borderRadius: radii.pill, borderWidth: 1 }, chipLabel: { fontFamily: fonts.semibold, fontSize: 12 },
  menuRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, menuIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: "center", justifyContent: "center" }, menuText: { flex: 1, minWidth: 0 }, menuTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text }, menuSubtitle: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  state: { alignItems: "center", justifyContent: "center", borderRadius: radii.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong, backgroundColor: colors.surface, padding: 28, gap: 10 }, stateIcon: { width: 54, height: 54, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" }, stateTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, textAlign: "center" },
  skeletonWrap: { padding: 18, gap: 12 }, skeletonCard: { height: 86, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, skeletonIcon: { width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.shimmer }, skeletonLines: { flex: 1, gap: 10 }, skeletonLine: { height: 10, borderRadius: radii.pill, backgroundColor: colors.shimmer },
  keyValue: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 16, paddingVertical: 4 }, keyValueText: { flexShrink: 1, textAlign: "left" },
});