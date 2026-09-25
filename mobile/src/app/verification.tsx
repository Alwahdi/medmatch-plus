import React, { useMemo, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { FileBadge2, FileCheck2, Upload } from "lucide-react-native";
import { Badge, Button, Card, EmptyState, ErrorState, Field, Loading, Row, Screen, ScreenHeader, styles as ui } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { useDocumentRequirements, useMyFacility, useVerificationDocuments, type DocumentRequirement } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { userMessage } from "@/lib/errors";
import { colors } from "@/lib/theme";
import { DateTimeField } from "@/components/date-time-field";

type PickedFile = { uri: string; name: string; mimeType?: string; size?: number };

export default function VerificationScreen() {
  const { target: rawTarget } = useLocalSearchParams<{ target?: string }>();
  const { user, isFacility } = useAuth();
  const { t, lang } = useI18n();
  const facility = useMyFacility();
  const target: "professional" | "facility" = rawTarget === "facility" || (!rawTarget && isFacility) ? "facility" : "professional";
  const requirements = useDocumentRequirements(target);
  const documents = useVerificationDocuments(target, facility.data?.id);
  const [selected, setSelected] = useState<DocumentRequirement | null>(null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => (requirements.data ?? []).map((requirement) => ({
    requirement,
    documents: (documents.data ?? []).filter((item) => item.doc_type === requirement.code),
  })), [documents.data, requirements.data]);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (!result.canceled) setFile(result.assets[0] ?? null);
  };

  const upload = async () => {
    if (!selected || !file || !user?.id) return setError(t("requiredField"));
    if (file.size && file.size > 10 * 1024 * 1024) return setError(t("fileFormatsHint"));
    if (selected.requires_expiry && !expiryDate) return setError(t("requiredField"));
    if (selected.requires_issue_date && !issueDate) return setError(t("requiredField"));
    if (selected.requires_issuer && !issuer.trim()) return setError(t("requiredField"));
    const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`)) && new Date(`${value}T12:00:00`).toISOString().slice(0, 10) === value;
    if ((issueDate && (!isDate(issueDate) || issueDate > new Date().toISOString().slice(0, 10))) || (expiryDate && (!isDate(expiryDate) || (issueDate && expiryDate <= issueDate)))) return setError(lang === "ar" ? "راجع تواريخ المستند؛ يجب أن يكون الانتهاء بعد الإصدار." : "Check the document dates; expiry must follow issue date.");
    if (target === "facility" && !facility.data?.id) return setError(t("completeProfile"));
    setBusy(true); setError(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const owner = target === "facility" ? facility.data?.id : user.id;
      if (!owner) throw new Error("OWNER_REQUIRED");
      const path = `${owner}/${Date.now()}-${safeName}`;
       const body = await (await fetch(file.uri)).arrayBuffer();
       if (body.byteLength > 10 * 1024 * 1024) throw new Error("FILE_TOO_LARGE");
      const bucket = target === "facility" ? "facility-docs" : "credentials";
      const uploaded = await supabase.storage.from(bucket).upload(path, body, { contentType: file.mimeType ?? undefined, upsert: false });
      if (uploaded.error) throw uploaded.error;
      const payload = { doc_type: selected.code, title: lang === "ar" ? selected.name_ar : selected.name_en, issuer: issuer.trim() || null, issue_date: issueDate || null, expiry_date: expiryDate || null, file_path: path, file_name: file.name };
      const inserted = target === "facility"
        ? await supabase.from("facility_documents").insert({ ...payload, facility_id: owner })
        : await supabase.from("credentials").insert({ ...payload, user_id: owner });
      if (inserted.error) { await supabase.storage.from(bucket).remove([path]); throw inserted.error; }
      if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t("uploadSuccess"));
      setSelected(null); setFile(null); setIssuer(""); setIssueDate(""); setExpiryDate("");
      void documents.refetch();
    } catch (uploadError) {
      setError(userMessage(uploadError, lang));
    } finally { setBusy(false); }
  };

  const statusLabel = (status: string) => status === "approved" ? t("documentApproved") : status === "rejected" ? t("documentRejected") : t("documentPending");
  const tone = (status: string) => status === "approved" ? "success" as const : status === "rejected" ? "danger" as const : "warning" as const;

  return <><Stack.Screen options={{ title: t("verificationDocuments") }} /><Screen>
    <ScreenHeader title={t("verificationDocuments")} sub={t("verificationDocumentsSub")} />
    {requirements.isPending || documents.isPending ? <Loading /> : requirements.isError || documents.isError ? <ErrorState message={userMessage(requirements.error ?? documents.error, lang)} onRetry={() => { void requirements.refetch(); void documents.refetch(); }} /> : grouped.length === 0 ? <EmptyState icon={FileBadge2} text={t("noDocuments")} /> : grouped.map(({ requirement, documents: items }) => <Card key={requirement.id} style={{ gap: 10 }}>
      <Row gap={8} wrap><Text style={[ui.bodyStrong, { flex: 1 }]}>{lang === "ar" ? requirement.name_ar : requirement.name_en}</Text><Badge label={requirement.is_required ? t("requiredDocument") : t("optionalDocument")} tone={requirement.is_required ? "warning" : "neutral"} /></Row>
      {(lang === "ar" ? requirement.note_ar : requirement.note_en) ? <Text style={ui.muted}>{lang === "ar" ? requirement.note_ar : requirement.note_en}</Text> : null}
      {items.map((item) => <View key={item.id} style={{ gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}><Row gap={8}><FileCheck2 size={18} color={colors.primary} /><Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>{item.file_name ?? item.title}</Text><Badge label={statusLabel(item.status)} tone={tone(item.status)} /></Row>{item.review_note ? <Text style={ui.error}>{item.review_note}</Text> : null}</View>)}
      <Button label={t("uploadDocument")} icon={Upload} variant="secondary" small onPress={() => { setSelected(requirement); setFile(null); setError(null); }} />
    </Card>)}
     {selected ? <Card style={{ borderColor: colors.primary }}><Text style={ui.bodyStrong}>{lang === "ar" ? selected.name_ar : selected.name_en}</Text><Button label={file?.name ?? t("chooseFile")} variant="secondary" onPress={() => void pick()} />{selected.requires_issuer ? <Field label={t("issuer")} value={issuer} onChangeText={setIssuer} required /> : null}{selected.requires_issue_date ? <DateTimeField label={t("issueDate")} value={issueDate} onChange={setIssueDate} dateOnly required /> : null}{selected.requires_expiry ? <DateTimeField label={t("expiryDate")} value={expiryDate} onChange={setExpiryDate} dateOnly required /> : null}<Text style={ui.muted}>{t("fileFormatsHint")}</Text>{error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}<Row gap={8}><View style={{ flex: 1 }}><Button label={t("submit")} loading={busy} onPress={() => void upload()} /></View><View style={{ flex: 1 }}><Button label={t("cancel")} variant="ghost" onPress={() => setSelected(null)} /></View></Row></Card> : null}
  </Screen></>;
}