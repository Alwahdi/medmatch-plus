import React from "react";
import { Image, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Image source={require("../../assets/images/syndeocare-mark.png")} resizeMode="contain" style={{ width: compact ? 38 : 54, height: compact ? 38 : 54 }}/>{compact ? null : <View><Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 21 }}>SyndeoCare</Text><Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11 }}>منصة التوظيف الطبي</Text></View>}</View>;
}