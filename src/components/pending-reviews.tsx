import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { ReviewDialog } from "@/components/review-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    title: "بانتظار تقييمك",
    body: "شاركنا تقييمك لتعاملات اكتملت — يساعد بقية المستخدمين على الاختيار.",
    job: "وظيفة",
    shift: "مناوبة",
  },
  en: {
    title: "Awaiting your review",
    body: "Rate your completed engagements — it helps others choose.",
    job: "Job",
    shift: "Shift",
  },
} as const;

/** بطاقة تجمع التعاملات المكتملة التي لم يقيّمها المستخدم بعد (منشأة أو مختص). */
export function PendingReviews({ userId }: { userId: string | undefined }) {
  const { lang } = useLang();
  const c = TXT[lang];

  const { data } = useQuery({
    queryKey: ["pending-reviews", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_pending_reviews");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!userId || !data?.length) return null;

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Star className="size-4 text-primary" />
        <h2 className="text-base font-semibold">
          {c.title} ({data.length})
        </h2>
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.body}</p>
      <ul className="mt-3 divide-y divide-border">
        {data.map((r) => (
          <li
            key={`${r.direction}-${r.facility_id}-${r.professional_user_id}`}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.counterpart_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {(r.shift_id ? c.shift : c.job) + (r.context_title ? ` · ${r.context_title}` : "")}
              </p>
            </div>
            <ReviewDialog
              direction={r.direction}
              facilityId={r.facility_id}
              professionalUserId={r.professional_user_id}
              authorUserId={userId}
              targetName={r.counterpart_name}
              jobId={r.job_id}
              shiftId={r.shift_id}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
