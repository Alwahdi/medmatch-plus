import { I18nManager, Platform } from "react-native";

export const colors = {
  bg: "#F6F8F8",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF3F3",
  border: "#DCE5E5",
  text: "#0E1A1A",
  textMuted: "#5B6B6B",
  primary: "#0F766E",
  primarySoft: "#E2F1EF",
  primaryText: "#FFFFFF",
  danger: "#B3261E",
  dangerSoft: "#FBE9E7",
  warning: "#8A5A00",
  warningSoft: "#FFF3D6",
  success: "#14743F",
  successSoft: "#E3F4E9",
};

export const radii = { sm: 8, md: 12, lg: 16, pill: 999 };

export const spacing = (n: number) => n * 4;

export const isRTL = I18nManager.isRTL;

export const fontFamily = Platform.select({ ios: "System", android: "sans-serif", default: "System" });

export const shadow = {
  shadowColor: "#0E1A1A",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
