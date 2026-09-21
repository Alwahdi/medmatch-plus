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
import { AlertCircle, ChevronLeft, Eye, EyeOff, Inbox, WifiOff } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radii, shadow, space, type as typo } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

export function Screen({ children, scroll = true, refreshControl, padded = true }: {
  children: React.ReactNode; scroll?: boolean; refreshControl?: React.ReactElement<RefreshControlProps>; padded?: boolean;
}) {
  const inner = padded ? <View style={styles.screenInner}>{children}</View> : children;
  return <SafeAreaView edges={["top"]} style={styles.screen}><KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : "height"}>{scroll ? <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"} automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} {...(refreshControl ? { refreshControl } : {})}>{inner}</ScrollView> : <View style={styles.fill}>{inner}</View>}</KeyboardAvoidingView></SafeAreaView>;
}

export function Title({ children, sub, eyebrow }: { children: React.ReactNode; sub?: string; eyebrow?: string }) {
  return <View style={styles.titleWrap}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text accessibilityRole="header" style={styles.title}>{children}</Text>{sub ? <Text style={styles.muted}>{sub}</Text> : null}</View>;
}

/** One header pattern for every screen: title start-aligned, optional action at the end. */
export function ScreenHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.screenHeader}>
      <View style={styles.screenHeaderText}>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>{title}</Text>
        {sub ? <Text style={styles.muted} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <View style={styles.sectionHeader}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>{action}</View>;
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
  const { rtl } = useI18n();
  const p = tone === "danger" ? { bg: colors.dangerSoft, fg: colors.danger } : tone === "accent" ? { bg: colors.accentSoft, fg: colors.accent } : tone === "violet" ? { bg: colors.brandVioletSoft, fg: colors.brandViolet } : { bg: colors.primarySoft, fg: colors.primary };
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.menuRow, { opacity: pressed ? .72 : 1 }]}><View style={[styles.menuIcon, { backgroundColor: p.bg }]}><Icon size={21} color={p.fg} strokeWidth={2.1} /></View><View style={styles.menuText}><Text style={styles.menuTitle}>{title}</Text>{subtitle ? <Text style={styles.menuSubtitle} numberOfLines={2}>{subtitle}</Text> : null}</View><View accessible={false} importantForAccessibility="no-hide-descendants"><ChevronLeft size={19} color={colors.textSubtle} style={{ transform: [{ scaleX: rtl ? 1 : -1 }] }} /></View></Pressable>;
}

export const Field = React.forwardRef<TextInput, TextInputProps & { label?: string; error?: string | null; required?: boolean }>(
  function Field({ label, error, required, ...props }, ref) {
    const { t } = useI18n();
    const isPassword = Boolean(props.secureTextEntry);
    const [revealed, setRevealed] = React.useState(false);
    const ToggleIcon = revealed ? EyeOff : Eye;
    return (
      <View style={styles.field}>
        {label ? <Text style={styles.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text> : null}
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

export function Loading({ rows = 3 }: { rows?: number }) { const { t } = useI18n(); return <View accessibilityLabel={t("loading")} accessibilityLiveRegion="polite" style={styles.skeletonWrap}>{Array.from({ length: rows }).map((_, i) => <View key={i} style={styles.skeletonCard}><View style={styles.skeletonIcon}/><View style={styles.skeletonLines}><View style={[styles.skeletonLine, { width: "68%" }]}/><View style={[styles.skeletonLine, { width: "42%" }]}/></View></View>)}</View>; }

export function PriorityCard({ icon: Icon, eyebrow, title, description, actionLabel, onPress, tone = "primary" }: {
  icon: LucideIcon; eyebrow: string; title: string; description?: string; actionLabel: string; onPress: () => void; tone?: "primary" | "warning" | "accent";
}) {
  const palette = tone === "warning"
    ? { bg: colors.warningSoft, fg: colors.warning }
    : tone === "accent"
      ? { bg: colors.accentSoft, fg: colors.accent }
      : { bg: colors.primarySoft, fg: colors.primary };
  return (
    <View style={[styles.priorityCard, { backgroundColor: palette.bg, borderColor: palette.bg }]}>
      <View style={[styles.priorityIcon, { backgroundColor: colors.surface }]}><Icon size={24} color={palette.fg} strokeWidth={2.2} /></View>
      <View style={styles.priorityCopy}>
        <Text style={[styles.eyebrow, { color: palette.fg }]}>{eyebrow}</Text>
        <Text style={styles.priorityTitle}>{title}</Text>
        {description ? <Text style={styles.muted}>{description}</Text> : null}
      </View>
      <Button label={actionLabel} small onPress={onPress} />
    </View>
  );
}

export function OfflineNotice({ text }: { text: string }) {
  return <View accessibilityRole="alert" style={styles.offlineNotice}><WifiOff size={18} color={colors.warning} /><Text style={[styles.muted, { flex: 1, color: colors.warning }]}>{text}</Text></View>;
}

export function EmptyState({ text, desc, icon: Icon = Inbox, action }: { text: string; desc?: string; icon?: LucideIcon; action?: React.ReactNode }) { return <View style={styles.state}><View style={styles.stateIcon}><Icon size={28} color={colors.primary} /></View><Text style={styles.stateTitle}>{text}</Text>{desc ? <Text style={[styles.muted, { textAlign: "center" }]}>{desc}</Text> : null}{action}</View>; }

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => { if (!active) { if (Platform.OS !== "web") void Haptics.selectionAsync(); onChange(o.value); } }}
            style={[styles.segment, active ? styles.segmentActive : null]}
          >
            <Text numberOfLines={1} style={[styles.segmentLabel, { color: active ? colors.text : colors.textMuted }]}>{o.label}</Text>
            {o.count ? <View style={styles.segmentCount}><Text style={styles.segmentCountLabel}>{o.count}</Text></View> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function StickyBar({ children }: { children: React.ReactNode }) {
  return <SafeAreaView edges={["bottom"]} style={styles.stickyBar}><View style={styles.stickyInner}>{children}</View></SafeAreaView>;
}

export function StatTile({ icon: Icon, value, label, tone = "primary", onPress }: { icon: LucideIcon; value: string | number; label: string; tone?: "primary" | "accent" | "violet" | "success"; onPress?: () => void }) {
  const p = tone === "accent" ? { bg: colors.accentSoft, fg: colors.accent } : tone === "violet" ? { bg: colors.brandVioletSoft, fg: colors.brandViolet } : tone === "success" ? { bg: colors.successSoft, fg: colors.success } : { bg: colors.primarySoft, fg: colors.primary };
  return (
    <Pressable accessibilityRole={onPress ? "button" : undefined} onPress={onPress} style={({ pressed }) => [styles.statTile, { opacity: pressed && onPress ? .75 : 1 }]}>
      <View style={[styles.statIcon, { backgroundColor: p.bg }]}><Icon size={17} color={p.fg} strokeWidth={2.2} /></View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { const { t } = useI18n(); return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.state, { borderColor: colors.dangerSoft }]}><View style={[styles.stateIcon, { backgroundColor: colors.dangerSoft }]}><AlertCircle size={28} color={colors.danger}/></View><Text style={styles.stateTitle}>{t("errorTitle")}</Text><Text style={styles.muted}>{message}</Text>{onRetry ? <Button label={t("retry")} variant="secondary" small onPress={onRetry}/> : null}</View>; }

export function KeyValue({ k, v }: { k: string; v: string }) { return <View style={styles.keyValue}><Text style={styles.muted}>{k}</Text><Text style={[styles.bodyStrong, styles.keyValueText]}>{v}</Text></View>; }

export const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  screenInner: { paddingHorizontal: space.gutter, paddingTop: space.lg, gap: space.lg },
  scrollContent: { paddingBottom: 120 },

  titleWrap: { gap: space.xs, marginBottom: space.xs },
  eyebrow: { ...typo.micro, color: colors.primary },
  title: { ...typo.title, color: colors.text, writingDirection: "auto" },
  screenHeader: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: space.md, marginBottom: space.xs },
  screenHeaderText: { flex: 1, minWidth: 0, gap: 2 },
  sectionHeader: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.sm },
  sectionTitle: { ...typo.section, color: colors.text },

  body: { ...typo.body, color: colors.text, writingDirection: "auto" },
  bodyStrong: { ...typo.bodyStrong, color: colors.text, writingDirection: "auto" },
  muted: { ...typo.caption, color: colors.textMuted, writingDirection: "auto" },
  label: { ...typo.label, color: colors.text },
  error: { ...typo.caption, fontSize: 12, color: colors.danger },

  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: space.md },
  button: { borderRadius: radii.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  buttonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  buttonLabel: { fontFamily: fonts.bold, lineHeight: 24 },
  iconButton: { width: 48, height: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },

  field: { gap: space.sm },
  input: { minHeight: 54, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, paddingHorizontal: space.lg, paddingVertical: 10, color: colors.text, fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, textAlign: "auto" },
  inputMultiline: { minHeight: 120, paddingTop: space.lg, textAlignVertical: "top" },
  inputError: { borderColor: colors.danger },
  inputWrap: { position: "relative", justifyContent: "center" },
  inputWithAction: { paddingEnd: 52 },
  inputAction: { position: "absolute", end: 6, height: 44, width: 44, alignItems: "center", justifyContent: "center" },

  badge: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radii.pill },
  badgeLabel: { ...typo.micro },
  chip: { paddingHorizontal: space.lg, minHeight: 44, justifyContent: "center", borderRadius: radii.pill, borderWidth: 1 },
  chipLabel: { ...typo.micro, fontSize: 13 },

  menuRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: space.md, paddingHorizontal: space.md, paddingVertical: space.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  menuIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1, minWidth: 0, gap: 1 },
  menuTitle: { ...typo.label, fontSize: 15, color: colors.text },
  menuSubtitle: { ...typo.caption, fontSize: 12, lineHeight: 18, color: colors.textMuted },

  state: { alignItems: "center", justifyContent: "center", borderRadius: radii.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong, backgroundColor: colors.surface, paddingHorizontal: space.xl, paddingVertical: space.xxl, gap: space.md },
  stateIcon: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  stateTitle: { ...typo.cardTitle, color: colors.text, textAlign: "center" },

  priorityCard: { borderRadius: radii.xl, borderWidth: 1, padding: space.lg, gap: space.md },
  priorityIcon: { width: 48, height: 48, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  priorityCopy: { gap: space.xs },
  priorityTitle: { ...typo.section, color: colors.text },
  offlineNotice: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: space.sm, borderRadius: radii.md, backgroundColor: colors.warningSoft, paddingHorizontal: space.md, paddingVertical: space.sm },

  skeletonWrap: { paddingHorizontal: space.gutter, paddingTop: space.lg, gap: space.md },
  skeletonCard: { height: 92, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: space.lg, flexDirection: "row", alignItems: "center", gap: space.md },
  skeletonIcon: { width: 46, height: 46, borderRadius: radii.md, backgroundColor: colors.shimmer },
  skeletonLines: { flex: 1, gap: 10 },
  skeletonLine: { height: 10, borderRadius: radii.pill, backgroundColor: colors.shimmer },

  keyValue: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: space.lg, paddingVertical: 6 },
  keyValueText: { flexShrink: 1, textAlign: "left" },

  segmented: { flexDirection: "row", backgroundColor: colors.surfaceMuted, borderRadius: radii.md, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: radii.sm, paddingHorizontal: space.sm },
  segmentActive: { backgroundColor: colors.surface, ...shadow },
  segmentLabel: { ...typo.micro, fontSize: 14 },
  segmentCount: { minWidth: 22, paddingHorizontal: 6, height: 20, borderRadius: radii.pill, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  segmentCountLabel: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18, color: colors.primaryText },

  stickyBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  stickyInner: { paddingHorizontal: space.gutter, paddingTop: space.md, paddingBottom: space.md, gap: space.sm },

  statTile: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, paddingVertical: space.md, gap: space.xs },
  statIcon: { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 32, color: colors.text },
  statLabel: { ...typo.caption, fontSize: 12, lineHeight: 18, color: colors.textMuted },
});