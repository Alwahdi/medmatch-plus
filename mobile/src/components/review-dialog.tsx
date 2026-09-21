import React, { useState } from "react";
import { Text, View } from "react-native";
import { Badge, Button, Card, Field, Row, styles as ui } from "./ui";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { userMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";

type Pending = {
  context_title: string;
  counterpart_name: string;
  direction: "pro_to_facility" | "facility_to_pro";
  facility_id: string;
  happened_at: string;
  job_id: string | null;
  professional_user_id: string;
  shift_id: string | null;
};

export function ReviewDialog({ pending }: { pending: Pending }) {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.rpc("save_engagement_review", {
      _direction: pending.direction,
      _facility_id: pending.facility_id,
      _professional_user_id: pending.professional_user_id,
      _rating: rating,
      ...(comment.trim() ? { _comment: comment.trim() } : {}),
      ...(pending.job_id ? { _job_id: pending.job_id } : {}),
      ...(pending.shift_id ? { _shift_id: pending.shift_id } : {}),
    });
    setBusy(false);
    if (err) {
      setError(userMessage(err, lang));
      return;
    }
    setDone(true);
    void qc.invalidateQueries({ queryKey: ["pending-reviews"] });
  };

  if (done) {
    return (
      <Card>
        <Text style={ui.body}>{lang === "ar" ? "شكراً، تم تسجيل تقييمك." : "Thanks, your review was saved."}</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Row gap={8} wrap>
        <Text style={[ui.bodyStrong, { flexShrink: 1 }]}>{pending.context_title}</Text>
        <Badge label={formatDate(pending.happened_at, lang)} />
      </Row>
      <Text style={ui.muted}>{pending.counterpart_name}</Text>
      <Text style={ui.label}>{t("rating")}</Text>
      <Row gap={6}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            label={n <= rating ? "★" : "☆"}
            variant={n <= rating ? "primary" : "secondary"}
            small
            onPress={() => setRating(n)}
          />
        ))}
      </Row>
      <Field label={t("comment")} value={comment} onChangeText={setComment} multiline />
      {error ? <Text style={ui.error}>{error}</Text> : null}
      <View>
        <Button label={t("sendReview")} onPress={submit} loading={busy} />
      </View>
    </Card>
  );
}
