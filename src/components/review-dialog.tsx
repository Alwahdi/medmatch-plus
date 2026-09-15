import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RatingInput } from "@/components/rating-stars";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";

const TXT = {
  ar: {
    rate: "تقييم",
    edit: "تعديل تقييمي",
    title: (n: string) => `تقييم ${n}`,
    desc: "تقييمك يساعد بقية المستخدمين. يمكنك تعديله لاحقاً.",
    stars: "التقييم العام",
    comment: "ملاحظاتك (اختياري)",
    placeholder: "كيف كانت التجربة؟ التواصل، الالتزام، بيئة العمل...",
    save: "إرسال التقييم",
    saving: "جارٍ الحفظ...",
    needStars: "اختر عدد النجوم أولاً",
    saved: "تم حفظ تقييمك، شكراً لك",
    failed: "تعذّر حفظ التقييم — يظهر التقييم فقط بعد تعامل مؤكد",
  },
  en: {
    rate: "Rate",
    edit: "Edit my review",
    title: (n: string) => `Rate ${n}`,
    desc: "Your review helps other users. You can edit it later.",
    stars: "Overall rating",
    comment: "Your notes (optional)",
    placeholder: "How was the experience? Communication, commitment, work environment...",
    save: "Submit review",
    saving: "Saving...",
    needStars: "Pick a star rating first",
    saved: "Your review was saved, thank you",
    failed: "Could not save the review — reviews require a confirmed engagement",
  },
} as const;

export function ReviewDialog({
  direction,
  facilityId,
  professionalUserId,
  authorUserId,
  targetName,
  jobId,
  shiftId,
}: {
  direction: "pro_to_facility" | "facility_to_pro";
  facilityId: string;
  professionalUserId: string;
  authorUserId: string;
  targetName: string;
  jobId?: string | null;
  shiftId?: string | null;
}) {
  const { lang } = useLang();
  const c = TXT[lang];
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data: existing } = useQuery({
    queryKey: ["review", direction, facilityId, professionalUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id,rating,comment")
        .eq("direction", direction)
        .eq("facility_id", facilityId)
        .eq("professional_user_id", professionalUserId)
        .maybeSingle();
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (rating < 1) throw new Error("stars");
      if (!authorUserId) throw new Error("author");
      const args: {
        _direction: "pro_to_facility" | "facility_to_pro";
        _facility_id: string;
        _professional_user_id: string;
        _rating: number;
        _comment?: string;
        _job_id?: string;
        _shift_id?: string;
      } = {
        _direction: direction,
        _facility_id: facilityId,
        _professional_user_id: professionalUserId,
        _rating: rating,
      };
      if (comment.trim()) args._comment = comment.trim();
      if (jobId) args._job_id = jobId;
      if (shiftId) args._shift_id = shiftId;
      const { error } = await supabase.rpc("save_engagement_review", args);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.saved);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["review", direction, facilityId, professionalUserId] });
      queryClient.invalidateQueries({ queryKey: ["facility-reviews", facilityId] });
    },
    onError: (e: Error) => toast.error(e.message === "stars" ? c.needStars : c.failed),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setRating(existing?.rating ?? 0);
          setComment(existing?.comment ?? "");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Star className="size-4" /> {existing ? c.edit : c.rate}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{c.title(targetName)}</DialogTitle>
          <DialogDescription>{c.desc}</DialogDescription>
        </DialogHeader>
        <RatingInput value={rating} onChange={setRating} label={c.stars} />
        <div>
          <p className="text-sm font-medium">{c.comment}</p>
          <Textarea
            rows={4}
            className="mt-2"
            maxLength={800}
            value={comment}
            placeholder={c.placeholder}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} loading={save.isPending}>
            {save.isPending ? c.saving : c.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
