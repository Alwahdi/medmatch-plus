import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { RatingStars } from "@/components/rating-stars";
import { RemoteAvatar } from "@/components/remote-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { countryLabel, experienceLabel, specialtyName } from "@/lib/format";
import { friendlyError, UserFacingError } from "@/lib/user-errors";

const PAGE = 8;

type Suggested = {
  id: string;
  specialty_id: string | null;
  years_experience: number;
  country: string | null;
  city: string | null;
  is_open_to_shifts: boolean;
  is_verified: boolean;
  rating_avg: number | string | null;
  rating_count: number | null;
};

const TXT = {
  ar: {
    title: "مرشحون مقترحون",
    sub: "مختصون مطابقون لتخصص هذه الفرصة وموقعها — الاقتراح مجاني ولا يُخصم من حصة البحث.",
    empty: "لا يوجد مرشحون مطابقون الآن",
    emptyBody: "لم نجد مختصين متاحين بهذا التخصص حالياً. جرّب البحث اليدوي بفلاتر أوسع.",
    verified: "موثّق",
    noReviews: "لا تقييمات بعد",
    invite: "إرسال دعوة",
    invited: "تمت الدعوة",
    more: "عرض المزيد",
    sent: "تم إرسال الدعوة",
    failed: "تعذّر إرسال الدعوة",
    duplicate: "سبق أن دعوت هذا المختص لهذه الفرصة",
    experience: (n: number) => experienceLabel(n, "ar"),
    locked: "وثّق منشأتك لعرض المرشحين المقترحين.",
  },
  en: {
    title: "Suggested candidates",
    sub: "Professionals matching this opportunity's specialty and location — free, nothing is deducted from your search allowance.",
    empty: "No matching candidates right now",
    emptyBody: "We found no available professionals in this specialty yet. Try a manual search with wider filters.",
    verified: "Verified",
    noReviews: "No reviews yet",
    invite: "Send invitation",
    invited: "Invited",
    more: "Show more",
    sent: "Invitation sent",
    failed: "Could not send the invitation",
    duplicate: "You already invited this professional to this opportunity",
    experience: (n: number) => experienceLabel(n, "en"),
    locked: "Verify your facility to see suggested candidates.",
  },
} as const;

/** اقتراح مجاني للمرشحين المطابقين لفرصة محددة، مع دعوة مباشرة وهوية محجوبة. */
export function SuggestedCandidates({
  jobId,
  shiftId,
  message,
  facilityVerified = true,
}: {
  jobId?: string | undefined;
  shiftId?: string | undefined;
  message?: string;
  facilityVerified?: boolean;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(PAGE);
  const [invited, setInvited] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      if (error) throw error;
      return data ?? [];
    },
  });

  const enabled = !!(jobId || shiftId) && facilityVerified;
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["suggested-candidates", jobId ?? shiftId, limit],
    enabled,
    queryFn: async () => {
      const args: Record<string, string | number> = { _limit: limit, _offset: 0 };
      if (jobId) args["_job_id"] = jobId;
      if (shiftId) args["_shift_id"] = shiftId;
      const { data, error } = await supabase.rpc("suggest_candidates", args);
      if (error) throw error;
      return (data ?? []) as Suggested[];
    },
  });

  const invite = useMutation({
    mutationFn: async (candidateId: string) => {
      const args: { _candidate_id: string; _job_id?: string; _shift_id?: string; _message?: string } = {
        _candidate_id: candidateId,
      };
      if (jobId) args._job_id = jobId;
      if (shiftId) args._shift_id = shiftId;
      if (message?.trim()) args._message = message.trim();
      const { error } = await supabase.rpc("send_candidate_invitation_from_search", args);
      if (error) throw error.message.includes("INVITATION_EXISTS") ? new UserFacingError(c.duplicate) : error;
    },
    onSuccess: (_d, candidateId) => {
      toast.success(c.sent);
      setInvited((prev) => [...prev, candidateId]);
      queryClient.invalidateQueries({ queryKey: ["invitations-sent"] });
    },
    onError: (e: Error, candidateId) => {
      toast.error(friendlyError(e, lang, c.failed));
      if (/CANDIDATE_NO_LONGER_SEARCHABLE|CANDIDATE_INVITE_NOT_ALLOWED|CANDIDATE_CONTACT_NOT_ALLOWED/i.test(e.message))
        setHidden((prev) => [...prev, candidateId]);
    },
  });

  if (!enabled)
    return facilityVerified ? null : (
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
          <Sparkles className="size-5 text-primary" /> {c.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{c.locked}</p>
      </section>
    );

  const rows = (data ?? []).filter((r) => !hidden.includes(r.id));

  return (
    <section>
      <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
        <Sparkles className="size-5 text-primary" /> {c.title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>

      {isPending ? (
        <div className="mt-4">
          <ListSkeleton rows={3} />
        </div>
      ) : isError ? (
        <ErrorState className="mt-4" onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={Sparkles} title={c.empty} description={c.emptyBody} />
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {rows.map((cand) => (
              <li
                key={cand.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-card"
              >
                <RemoteAvatar value={null} icon={UserRound} className="size-10 rounded-lg" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    {specialtyName(specialties?.find((s) => s.id === cand.specialty_id), lang)}
                    {cand.is_verified && (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="size-3" /> {c.verified}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.experience(cand.years_experience)}
                    {[cand.city, countryLabel(cand.country, lang)].filter(Boolean).length
                      ? ` · ${[cand.city, countryLabel(cand.country, lang)].filter(Boolean).join("، ")}`
                      : ""}
                  </p>
                  <div className="mt-1">
                    {cand.rating_count ? (
                      <RatingStars value={Number(cand.rating_avg ?? 0)} count={cand.rating_count} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{c.noReviews}</span>
                    )}
                  </div>
                </div>
                <div className="ms-auto">
                  {invited.includes(cand.id) ? (
                    <Badge variant="secondary">{c.invited}</Badge>
                  ) : (
                    <Button size="sm" disabled={invite.isPending} onClick={() => invite.mutate(cand.id)}>
                      <Send className="size-4" /> {c.invite}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {rows.length >= limit && (
            <Button variant="outline" className="mt-4 min-h-11" onClick={() => setLimit((n) => n + PAGE)}>
              {c.more}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
