import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth";
import { colors } from "@/lib/theme";
import { supabase } from "@/lib/supabase";

export default function Entry() {
  const { loading, session, roles, rolesError } = useAuth();
  const [needsChallenge, setNeedsChallenge] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) { setNeedsChallenge(false); return; }
    let active = true;
    void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      if (active) setNeedsChallenge(!error && data?.nextLevel === "aal2" && data.currentLevel !== "aal2");
    });
    return () => { active = false; };
  }, [loading, session?.user.id, session?.access_token]);

  if (loading || (session && needsChallenge === null)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/sign-in" />;
  if (needsChallenge) return <Redirect href="/mfa-challenge" />;
  if (!rolesError && roles.length === 0) return <Redirect href="/welcome" />;
  return <Redirect href="/(tabs)" />;
}
