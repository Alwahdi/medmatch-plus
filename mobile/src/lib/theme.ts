import { I18nManager } from "react-native";

export const colors = {
  bg: "#F6F8FA",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF3F6",
  surfaceRaised: "#FBFCFD",
  border: "#DFE6EA",
  borderStrong: "#CAD5DC",
  text: "#202A33",
  textMuted: "#667581",
  textSubtle: "#94A1AA",
  primary: "#2F8194",
  primaryStrong: "#256B7B",
  primarySoft: "#E5F2F4",
  primaryText: "#FFFFFF",
  accent: "#52669B",
  accentSoft: "#E9EDF7",
  brandViolet: "#653C68",
  brandVioletSoft: "#F1E9F2",
  danger: "#B94343",
  dangerSoft: "#FBECEC",
  warning: "#9A6812",
  warningSoft: "#FFF4D9",
  success: "#277A55",
  successSoft: "#E4F3EB",
  overlay: "rgba(20, 31, 40, 0.48)",
  shimmer: "#E8EDF0",
  messageOnPrimary: "#DDF2F5",
} as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const spacing = (n: number) => n * 4;
export const isRTL = I18nManager.isRTL;
export const fonts = {
  regular: "Cairo_400Regular",
  medium: "Cairo_500Medium",
  semibold: "Cairo_600SemiBold",
  bold: "Cairo_700Bold",
} as const;

export const shadow = {
  shadowColor: colors.text,
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const raisedShadow = {
  shadowColor: colors.text,
  shadowOpacity: 0.12,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
} as const;