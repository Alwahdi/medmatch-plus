import React, { useState } from "react";
import { Text } from "react-native";
import { Stack } from "expo-router";
import { Card, Chip, ErrorState, Loading, Row, Screen, Title, styles as ui } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { legalBody, legalTitle, useLegalDocuments, type LegalKey } from "@/lib/legal";
import { userMessage } from "@/lib/errors";

const KEYS: LegalKey[] = ["privacy", "terms", "applicant_commitments", "publisher_commitments", "contact_info"];

export default function LegalScreen() {
  const { t, lang } = useI18n();
  const docs = useLegalDocuments();
  const [key, setKey] = useState<LegalKey>("privacy");

  const doc = (docs.data ?? []).find((d) => d.key === key) ?? null;

  return (
    <>
      <Stack.Screen options={{ title: t("legal") }} />
      <Screen>
        <Title>{t("legal")}</Title>
        <Row gap={8} wrap>
          {KEYS.map((k) => {
            const d = (docs.data ?? []).find((x) => x.key === k) ?? null;
            return (
              <Chip
                key={k}
                label={d ? legalTitle(d, lang) : k}
                active={key === k}
                onPress={() => setKey(k)}
              />
            );
          })}
        </Row>
        {docs.isPending ? (
          <Loading />
        ) : docs.isError ? (
          <ErrorState message={userMessage(docs.error, lang)} onRetry={() => void docs.refetch()} />
        ) : !doc ? (
          <Card>
            <Text style={ui.muted}>{lang === "ar" ? "لا يوجد محتوى منشور." : "No published content."}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={ui.bodyStrong}>{legalTitle(doc, lang)}</Text>
            {legalBody(doc, lang)
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .map((line, i) =>
                line.trim().startsWith("#") ? (
                  <Text key={i} style={[ui.bodyStrong, { marginTop: 8 }]}> 
                    {line.replace(/^#+\s*/, "")}
                  </Text>
                ) : (
                  <Text key={i} style={ui.muted}>
                    {line}
                  </Text>
                ),
              )}
          </Card>
        )}
      </Screen>
    </>
  );
}
