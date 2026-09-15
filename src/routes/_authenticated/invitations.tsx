import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Building2, CalendarClock, Check, MailOpen, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { RemoteAvatar } from "@/components/remote-avatar";
import { useConfirm } from "@/components/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { countryLabel, relativeTime } from "@/lib/format";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/invitations")({
  head: () => ({
    meta: [
      { title: "الدعوات | SyndeoCare" },
      {
        name: "description",
        content: "استعرض دعوات المنشآت الصحية للوظائف والمناوبات واقبلها أو ارفضها بنقرة واحدة.",
      },
      { property: "og:title", content: "الدعوات | SyndeoCare" },
      { property: "og:description", content: "دعوات مباشرة من المنشآت الصحية للكوادر الطبية." },
    ],
  }),
  component: InvitationsPage,
});

const TXT = {
  ar: {
    title: "الدعوات",
    subtitle: "منشآت صحية دعتك مباشرة لوظائف أو مناوبات. عند القبول تُفتح المحادثة ويظهر اسم المنشأة.",
    emptyTitle: "لا توجد دعوات حالياً",
    emptyBody: "أكمل ملفك ووثّق مستنداتك لترفع فرص وصول دعوات المنشآت إليك.",
    job: "وظيفة",
    shift: "مناوبة",
    view: "عرض الإعلان",
    accept: "قبول الدعوة",
    decline: "رفض",
    accepted: "مقبولة",
    declined: "مرفوضة",
    cancelled: "ملغاة",
    pending: "بانتظار ردك",
    confirmAcceptTitle: "قبول الدعوة؟",
    confirmAcceptBody: "سيتم إعلام المنشأة وفتح محادثة مباشرة معك.",
    confirmDeclineTitle: "رفض الدعوة؟",
    confirmDeclineBody: "لن تتمكن من التراجع عن الرفض لاحقاً.",
    done: "تم تحديث الدعوة",
    failed: "تعذّر تحديث الدعوة",
    goMessages: "الذهاب للمحادثة",
    verified: "موثّقة",
  },
  en: {
    title: "Invitations",
    subtitle: "Facilities that invited you to a job or a shift. Accepting opens a chat and reveals the facility.",
    emptyTitle: "No invitations yet",
    emptyBody: "Complete your profile and verify your documents to attract more facility invitations.",
    job: "Job",
    shift: "Shift",
    view: "View posting",
    accept: "Accept",
    decline: "Decline",
    accepted: "Accepted",
    declined: "Declined",
    cancelled: "Cancelled",
    pending: "Awaiting your reply",
    confirmAcceptTitle: "Accept this invitation?",
    confirmAcceptBody: "The facility will be notified and a direct conversation will open.",
    confirmDeclineTitle: "Decline this invitation?",
    confirmDeclineBody: "You will not be able to undo this later.",
    done: "Invitation updated",
    failed: "Could not update the invitation",
    goMessages: "Go to messages",
    verified: "Verified",
  },
} as const;

function InvitationsPage() {
  const { lang } = useLang();
  const c = TXT[lang];
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { confirm, confirmDialog } = useConfirm();

  const { data } = useQuery({
    queryKey: ["my-invitations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("invitations")
        .select(
          "id,status,message,created_at,job_id,shift_id,facility_id,facilities(id,name_ar,city,country,is_verified,logo_url),jobs(id,title,slug),shifts(id,title,starts_at)",
        )
        .eq("professional_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return rows ?? [];
    },
  });

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase.from("invitations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.done);
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error(c.failed),
  });

  async function act(id: string, status: "accepted" | "declined") {
    const ok = await confirm({
      title: status === "accepted" ? c.confirmAcceptTitle : c.confirmDeclineTitle,
      description: status === "accepted" ? c.confirmAcceptBody : c.confirmDeclineBody,
      confirmLabel: status === "accepted" ? c.accept : c.decline,
      destructive: status === "declined",
    });
    if (ok) respond.mutate({ id, status });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{c.subtitle}</p>

      {data?.length ? (
        <ul className="mt-6 space-y-4">
          {data.map((inv) => {
            const f = inv.facilities;
            const isJob = !!inv.job_id;
            return (
              <li key={inv.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <RemoteAvatar
                    value={f?.logo_url ?? null}
                    icon={Building2}
                    className="size-12 rounded-lg"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold">
                      {f?.name_ar}
                      {f?.is_verified && (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="size-3" /> {c.verified}
                        </Badge>
                      )}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-sm">
                      {isJob ? (
                        <Briefcase className="size-4 text-primary" />
                      ) : (
                        <CalendarClock className="size-4 text-primary" />
                      )}
                      <span className="text-muted-foreground">{isJob ? c.job : c.shift}:</span>
                      {isJob ? inv.jobs?.title : inv.shifts?.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[f?.city, countryLabel(f?.country ?? null, lang)].filter(Boolean).join("، ")} ·{" "}
                      {relativeTime(inv.created_at, lang)}
                    </p>
                  </div>
                  <Badge
                    className="ms-auto"
                    variant={inv.status === "pending" ? "default" : "secondary"}
                  >
                    {c[inv.status as "pending" | "accepted" | "declined" | "cancelled"]}
                  </Badge>
                </div>

                {inv.message && (
                  <p className="mt-3 rounded-lg bg-surface p-3 text-sm leading-relaxed">
                    {inv.message}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {isJob && inv.jobs ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/jobs/$jobId" params={{ jobId: inv.jobs.slug ?? inv.jobs.id }}>
                        {c.view}
                      </Link>
                    </Button>
                  ) : inv.shifts ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/shifts/$shiftId" params={{ shiftId: inv.shifts.id }}>
                        {c.view}
                      </Link>
                    </Button>
                  ) : null}

                  {inv.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => act(inv.id, "accepted")} disabled={respond.isPending}>
                        <Check className="size-4" /> {c.accept}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => act(inv.id, "declined")}
                        disabled={respond.isPending}
                      >
                        <X className="size-4" /> {c.decline}
                      </Button>
                    </>
                  ) : inv.status === "accepted" ? (
                    <Button asChild size="sm">
                      <Link to="/messages">{c.goMessages}</Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState icon={MailOpen} title={c.emptyTitle} description={c.emptyBody} />
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
