import React, { useCallback, useRef, useState } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { Button, Card, styles as ui } from "./ui";
import { useI18n } from "@/lib/i18n";
import { legalBody, legalTitle, useLegalDocuments, useMyConsents, useRecordConsent, type LegalKey } from "@/lib/legal";
import { userMessage } from "@/lib/errors";
import { colors, radii } from "@/lib/theme";

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
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" }}>
        <View style={{ maxHeight: "85%", backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: 20, gap: 12 }}>
          <Text style={ui.title}>{legalTitle(doc, lang) || t("consentTitle")}</Text>
          {legalBody(doc, lang) ? (
            <ScrollView style={{ maxHeight: 340 }}>
              <Text style={ui.body}>{legalBody(doc, lang)}</Text>
            </ScrollView>
          ) : (
            <Card>
              <Text style={ui.body}>{lang === "ar" ? "أتعهد بأن بيانات الفرصة صحيحة، وأن النشر لغرض توظيف مهني مشروع، وألتزم بخصوصية المتقدمين وعدم طلب رسوم منهم." : "I confirm this opportunity is accurate and for legitimate recruitment, and I will protect applicant privacy and never request fees from them."}</Text>
            </Card>
          )}
          <Text style={ui.muted}>{t("consentNote")}</Text>
          {error ? (
            <Card style={{ borderColor: colors.dangerSoft }}>
              <Text style={ui.error}>{error}</Text>
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
