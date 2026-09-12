import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MessageSquare, ShieldQuestion } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | SyndeoCare" },
      {
        name: "description",
        content:
          "راسل فريق SyndeoCare لأي استفسار عن الوظائف، المناوبات، توثيق التراخيص، أو اشتراكات المنشآت.",
      },
      { property: "og:title", content: "تواصل معنا | SyndeoCare" },
      { property: "og:description", content: "فريق SyndeoCare جاهز للرد على استفساراتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contact_messages").insert({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || null,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("وصلتنا رسالتك، وسنرد عليك قريباً");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    },
    onError: () => toast.error("تعذّر إرسال الرسالة، حاول مرة أخرى"),
  });

  const valid = name.trim().length > 1 && /.+@.+\..+/.test(email) && message.trim().length > 9;

  return (
    <section className="py-14">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">تواصل معنا</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            عندك استفسار أو ملاحظة أو مشكلة في حسابك؟ اكتب لنا وسنرد خلال يوم عمل واحد.
          </p>
          <div className="mt-8 space-y-5">
            {[
              { icon: ShieldQuestion, t: "توثيق التراخيص", d: "استفسارات رفع الوثائق وحالة المراجعة." },
              { icon: MessageSquare, t: "المنشآت والاشتراكات", d: "الباقات، الحدود، وطلبات الترقية." },
              { icon: Mail, t: "الدعم العام", d: "مشاكل الدخول، الحساب، أو الإبلاغ عن إعلان." },
            ].map((i) => (
              <div key={i.t} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                  <i.icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold">{i.t}</h2>
                  <p className="text-sm text-muted-foreground">{i.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          className="rounded-2xl border border-border bg-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) send.mutate();
          }}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="c-name">الاسم</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="c-email">البريد الإلكتروني</Label>
              <Input
                id="c-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="c-subject">الموضوع (اختياري)</Label>
              <Input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="c-message">الرسالة</Label>
              <Textarea
                id="c-message"
                rows={6}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1.5"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">{message.length}/2000</p>
            </div>
            <Button type="submit" className="w-full" disabled={!valid || send.isPending}>
              {send.isPending ? "جارٍ الإرسال…" : "إرسال الرسالة"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
