import React, { useMemo, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";

type PickedFile = { uri: string; name: string; mimeType?: string; size?: number };

export default function VerificationScreen() {
  const { target: rawTarget } = useLocalSearchParams<{ target?: string }>();
  const router = useRouter();
  const { user, isFacility } = useAuth();
  const { t, lang } = useI18n();
  const facility = useMyFacility();
  const target: "professional" | "facility" = rawTarget === "facility" || (!rawTarget && isFacility) ? "facility" : "professional";
  const requirements = useDocumentRequirements(target);
  const documents = useVerificationDocuments(target, facility.data?.id);
  const qc = useQueryClient();
  const renewal = useQuery({ queryKey: ["document-renewal-policy"], queryFn: async () => { const { data, error } = await supabase.from("document_renewal_policy").select("renewal_days").single(); if (error) throw error; return data.renewal_days; } });
  const requests = useQuery({ queryKey: ["document-upload-requests", user?.id, target], enabled: !!user?.id, queryFn: async () => { const { data, error } = await supabase.from("document_upload_requests").select("id,doc_type,status,admin_note,reviewed_at").eq("user_id", user?.id ?? "").eq("target", target).order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const [requestType, setRequestType] = useState<string | null>(null);
  const [reason, setReason] = useState("");
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
  const replacementState = (code: string, items: typeof documents.data) => {
    const approved = (items ?? []).find((item) => item.status === "approved");
    if (!approved) return "open";
    const days = renewal.data ?? 60;
    if (approved.expiry_date && new Date(`${approved.expiry_date}T23:59:59`).getTime() <= Date.now() + days * 86400000) return "renewal";
    const permission = requests.data?.find((r) => r.doc_type === code && r.status === "approved" && r.reviewed_at && new Date(r.reviewed_at).getTime() > new Date(approved.created_at).getTime());
    return permission ? "permission" : "locked";
  };
  const requestReplacement = async () => {
    if (!requestType || !user?.id || reason.trim().length < 5) return setError(lang === "ar" ? "اكتب سبب الطلب (5 أحرف على الأقل)." : "Explain your request (at least 5 characters).");
    setBusy(true); setError(null);
    const { error: failure } = await supabase.from("document_upload_requests").insert({ user_id: user.id, facility_id: target === "facility" ? facility.data?.id ?? null : null, target, doc_type: requestType, reason: reason.trim() });
    setBusy(false);
    if (failure) return setError(failure.code === "23505" ? (lang === "ar" ? "الطلب قيد المراجعة بالفعل." : "A request is already pending.") : userMessage(failure, lang));
    setRequestType(null); setReason(""); void requests.refetch();
  };

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/*"], copyToCacheDirectory: true });
    if (!result.canceled) setFile(result.assets[0] ?? null);
  };

  const upload = async () => {
    if (!selected || !file || !user?.id) return setError(t("requiredField"));
    if (replacementState(selected.code, (documents.data ?? []).filter((d) => d.doc_type === selected.code)) === "locked") return setError(userMessage("DOCUMENT_RENEWAL_LOCKED", lang));
    if (file.size && file.size > 10 * 1024 * 1024) return setError(t("fileFormatsHint"));
    if (selected.requires_expiry && !expiryDate) return setError(t("requiredField"));
    if (selected.requires_issue_date && !issueDate) return setError(t("requiredField"));
    if (selected.requires_issuer && !issuer.trim()) return setError(t("requiredField"));
    const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`)) && new Date(`${value}T12:00:00`).toISOString().slice(0, 10) === value;
     const now = new Date();
     const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
     if ((issueDate && (!isDate(issueDate) || issueDate > today)) || (expiryDate && (!isDate(expiryDate) || (issueDate && expiryDate <= issueDate)))) return setError(lang === "ar" ? "راجع تواريخ المستند؛ يجب أن يكون الانتهاء بعد الإصدار." : "Check the document dates; expiry must follow issue date.");
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
      void qc.invalidateQueries({ queryKey: ["document-upload-requests"] });
    } catch (uploadError) {
      setError(userMessage(uploadError, lang));
    } finally { setBusy(false); }
  };

  const statusLabel = (status: string) => status === "approved" ? t("documentApproved") : status === "rejected" ? t("documentRejected") : t("documentPending");
  const tone = (status: string) => status === "approved" ? "success" as const : status === "rejected" ? "danger" as const : "warning" as const;

  return <><Stack.Screen options={{ title: t("verificationDocuments") }} /><Screen>
    <ScreenHeader title={t("verificationDocuments")} sub={t("verificationDocumentsSub")} />
     {requirements.isPending || (target === "facility" && facility.isPending) || (target !== "facility" || facility.data?.id ? documents.isPending : false) || renewal.isPending || requests.isPending ? <Loading /> : requirements.isError || (target === "facility" && facility.isError) || (target !== "facility" || facility.data?.id ? documents.isError : false) || renewal.isError || requests.isError ? <ErrorState message={userMessage(requirements.error ?? facility.error ?? documents.error ?? renewal.error ?? requests.error, lang)} onRetry={() => { void requirements.refetch(); void facility.refetch(); void documents.refetch(); void renewal.refetch(); void requests.refetch(); }} /> : target === "facility" && !facility.data?.id ? <Card><Text style={ui.bodyStrong}>{lang === "ar" ? "أكمل بيانات المنشأة أولًا" : "Complete your facility profile first"}</Text><Text style={ui.muted}>{lang === "ar" ? "احفظ اسم المنشأة وموقعها قبل رفع مستنداتها." : "Save your facility name and location before uploading its documents."}</Text><Button label={lang === "ar" ? "إكمال بيانات المنشأة" : "Complete facility profile"} onPress={() => router.push("/facility/profile")} /></Card> : grouped.length === 0 ? <EmptyState icon={FileBadge2} text={t("noDocuments")} /> : grouped.map(({ requirement, documents: items }) => <Card key={requirement.id} style={{ gap: 10 }}>
      <Row gap={8} wrap><Text style={[ui.bodyStrong, { flex: 1 }]}>{lang === "ar" ? requirement.name_ar : requirement.name_en}</Text><Badge label={requirement.is_required ? t("requiredDocument") : t("optionalDocument")} tone={requirement.is_required ? "warning" : "neutral"} /></Row>
      {(lang === "ar" ? requirement.note_ar : requirement.note_en) ? <Text style={ui.muted}>{lang === "ar" ? requirement.note_ar : requirement.note_en}</Text> : null}
      {items.map((item) => <View key={item.id} style={{ gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}><Row gap={8}><FileCheck2 size={18} color={colors.primary} /><Text style={[ui.body, { flex: 1 }]} numberOfLines={1}>{item.file_name ?? item.title}</Text><Badge label={statusLabel(item.status)} tone={tone(item.status)} /></Row>{item.review_note ? <Text style={ui.error}>{item.review_note}</Text> : null}</View>)}
      {replacementState(requirement.code, items) === "locked" ? <>
        <Text style={ui.muted}>{lang === "ar" ? "الوثيقة معتمدة. تُفتح إعادة الرفع قبل الانتهاء أو بعد موافقة الإدارة." : "This document is approved. Renewal opens before expiry or with team approval."}</Text>
        {requests.data?.some((r) => r.doc_type === requirement.code && r.status === "pending") ? <Badge label={lang === "ar" ? "طلب الاستبدال قيد المراجعة" : "Replacement request pending"} tone="warning" /> : <Button label={lang === "ar" ? "طلب رفع بديل" : "Request replacement"} variant="secondary" small onPress={() => { setRequestType(requirement.code); setReason(""); setError(null); }} />}
        {requests.data?.find((r) => r.doc_type === requirement.code && r.status === "rejected")?.admin_note ? <Text style={ui.error}>{requests.data.find((r) => r.doc_type === requirement.code && r.status === "rejected")?.admin_note}</Text> : null}
      </> : <Button label={replacementState(requirement.code, items) === "renewal" ? (lang === "ar" ? "تجديد الوثيقة" : "Renew document") : t("uploadDocument")} icon={Upload} variant="secondary" small onPress={() => { setSelected(requirement); setFile(null); setError(null); }} />}
    </Card>)}
     {selected ? <Card style={{ borderColor: colors.primary }}><Text style={ui.bodyStrong}>{lang === "ar" ? selected.name_ar : selected.name_en}</Text><Button label={file?.name ?? t("chooseFile")} variant="secondary" onPress={() => void pick()} />{selected.requires_issuer ? <Field label={t("issuer")} value={issuer} onChangeText={setIssuer} required /> : null}{selected.requires_issue_date ? <DateTimeField label={t("issueDate")} value={issueDate} onChange={setIssueDate} dateOnly required /> : null}{selected.requires_expiry ? <DateTimeField label={t("expiryDate")} value={expiryDate} onChange={setExpiryDate} dateOnly required /> : null}<Text style={ui.muted}>{t("fileFormatsHint")}</Text>{error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}<Row gap={8}><View style={{ flex: 1 }}><Button label={t("submit")} loading={busy} onPress={() => void upload()} /></View><View style={{ flex: 1 }}><Button label={t("cancel")} variant="ghost" onPress={() => setSelected(null)} /></View></Row></Card> : null}
    {requestType ? <Card style={{ gap: 12 }}><Text style={ui.bodyStrong}>{lang === "ar" ? "طلب السماح برفع بديل" : "Request a replacement upload"}</Text><Field label={lang === "ar" ? "سبب الاستبدال" : "Reason for replacement"} value={reason} onChangeText={setReason} multiline maxLength={500} />{error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}<Button label={lang === "ar" ? "إرسال للإدارة" : "Send for review"} loading={busy} onPress={() => void requestReplacement()} /><Button label={t("cancel")} variant="ghost" onPress={() => setRequestType(null)} /></Card> : null}
  </Screen></>;
}