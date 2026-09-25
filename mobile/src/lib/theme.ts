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
  primary: "#256B7B",
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

/** Layout rhythm: one 4pt scale used everywhere. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  gutter: 16,
} as const;

/**
 * Arabic (Cairo) needs generous line-height and no small sizes.
 * Minimum readable size in the app is 12.
 */
export const type = {
  display: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 36 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 30 },
  section: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 26 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 24 },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  micro: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 },
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