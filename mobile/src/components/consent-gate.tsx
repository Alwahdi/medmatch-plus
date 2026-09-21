import React, { useCallback, useRef, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { Button, Card, styles as ui } from "./ui";
import { useI18n } from "@/lib/i18n";
import { legalBody, legalTitle, useLegalDocuments, useMyConsents, useRecordConsent, type LegalKey } from "@/lib/legal";
import { userMessage } from "@/lib/errors";

/**
 * Mirrors the web consent gate: the user must explicitly accept the current
 * version of the commitments document before applying/booking or publishing.
 */
export function useConsentGate(key: LegalKey) {
  const { t, lang } = useI18n();
  const { data: documents } = useLegalDocuments();
  const { data: consents } = useMyConsents();
  const record = useRecordConsent();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const doc = (documents ?? []).find((d) => d.key === key) ?? null;
  const accepted = (consents ?? []).some((c) => c.doc_key === key && c.version >= (doc?.version ?? 1));

  const ensure = useCallback(async () => {
    if (accepted) return true;
    setError(null);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, [accepted]);

  const finish = (ok: boolean) => {
    setOpen(false);
    resolver.current?.(ok);
    resolver.current = null;
  };

  const node = (
    <Modal visible={open} animationType="slide" transparent onRequestClose={() => finish(false)}>
      <View style={{ flex: 1, backgroundColor: "rgba(14,26,26,0.45)", justifyContent: "flex-end" }}>
        <View style={{ maxHeight: "85%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, gap: 12 }}>
          <Text style={ui.title}>{legalTitle(doc, lang) || t("consentTitle")}</Text>
          <ScrollView style={{ maxHeight: 340 }}>
            <Text style={ui.body}>{legalBody(doc, lang)}</Text>
          </ScrollView>
          <Text style={ui.muted}>{t("consentNote")}</Text>
          {error ? (
            <Card style={{ borderColor: "#FBE9E7" }}>
              <Text style={{ color: "#B3261E" }}>{error}</Text>
            </Card>
          ) : null}
          <Button
            label={t("consentAgree")}
            loading={record.isPending}
            onPress={() => {
              record.mutate(
                { key, version: doc?.version ?? 1 },
                {
                  onSuccess: () => finish(true),
                  onError: (e) => setError(userMessage(e, lang)),
                },
              );
            }}
          />
          <Button label={t("cancel")} variant="ghost" onPress={() => finish(false)} />
        </View>
      </View>
    </Modal>
  );

  return { ensure, node, accepted };
}
