import React from "react";
import { Image, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <View style={{ alignItems: "center", gap: compact ? 0 : 8 }}><Image accessibilityLabel="SyndeoCare" source={require("../../assets/images/syndeocare-mark.png")} resizeMode="contain" style={{ width: compact ? 38 : 72, height: compact ? 38 : 72 }}/>{compact ? null : <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 23, lineHeight: 34 }}>SyndeoCare</Text>}</View>;
}