import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MessageSquare, ShieldQuestion, Send, ArrowLeft, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | SyndeoCare" },
      {
        name: "description",
        content:
          "راسل فريق SyndeoCare لأي استفسار عن الوظائف، المناوبات، توثيق التراخيص، أو حساب المنشأة.",
      },
      { property: "og:title", content: "تواصل معنا | SyndeoCare" },
      { property: "og:description", content: "فريق SyndeoCare جاهز للرد على استفساراتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

const TXT = {
  ar: {
    badge: "فريق الدعم جاهز",
    title: "تواصل معنا",
    sub: "عندك استفسار أو ملاحظة أو مشكلة في حسابك؟ اكتب لنا وسنرد خلال يوم عمل واحد.",
    topicsLabel: "مواضيع الدعم",
    topicsTitle: "كيف نقدر نساعدك؟",
    topics: [
      { t: "توثيق التراخيص", d: "استفسارات رفع الوثائق وحالة المراجعة." },
      { t: "دعم المنشآت", d: "النشر، حدود الاستخدام، وإدارة حساب المنشأة." },
      { t: "الدعم العام", d: "مشاكل الدخول، الحساب، أو الإبلاغ عن إعلان." },
    ],
    browseJobs: "تصفح الوظائف",
    sendMessageLabel: "أرسل رسالة",
    formTitle: "نموذج التواصل",
    name: "الاسم",
    email: "البريد الإلكتروني",
    subject: "الموضوع (اختياري)",
    message: "الرسالة",
    sending: "جارٍ الإرسال…",
    send: "إرسال الرسالة",
    success: "وصلتنا رسالتك، وسنرد عليك قريباً",
    failure: "تعذّر إرسال الرسالة، حاول مرة أخرى",
  },
  en: {
    badge: "Support team ready to help",
    title: "Contact us",
    sub: "Have a question, feedback, or an issue with your account? Write to us and we'll reply within one business day.",
    topicsLabel: "Support topics",
    topicsTitle: "How can we help?",
    topics: [
      { t: "License verification", d: "Questions about uploading documents and review status." },
      { t: "Facility support", d: "Publishing, usage limits, and facility account help." },
      { t: "General support", d: "Login issues, account problems, or reporting a listing." },
    ],
    browseJobs: "Browse jobs",
    sendMessageLabel: "Send a message",
    formTitle: "Contact form",
    name: "Name",
    email: "Email",
    subject: "Subject (optional)",
    message: "Message",
    sending: "Sending…",
    send: "Send message",
    success: "We received your message and will get back to you soon",
    failure: "Couldn't send the message, please try again",
  },
} as const;

function Contact() {
  const { lang } = useLang();
  const c = TXT[lang];
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
      toast.success(c.success);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    },
    onError: () => toast.error(c.failure),
  });

  const valid = name.trim().length > 1 && /.+@.+\..+/.test(email) && message.trim().length > 9;

  const icons: LucideIcon[] = [ShieldQuestion, MessageSquare, Mail];

  return (
    <>
      {/* Hero */}
      <section className="page-hero py-14 md:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-sm font-medium ring-1 ring-white/20">
            <Send className="size-4" />
            {c.badge}
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold md:text-5xl">{c.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
            {c.sub}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="card-lift h-fit rounded-lg border border-border bg-card p-6">
            <p className="section-label">{c.topicsLabel}</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold">{c.topicsTitle}</h2>
            <div className="mt-6 space-y-5">
              {c.topics.map((i, idx) => {
                const Icon = icons[idx]!;
                return (
                  <div key={i.t} className="flex gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold">{i.t}</h3>
                      <p className="text-sm text-muted-foreground">{i.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="mt-8" variant="outline" asChild>
              <Link to="/jobs">
                {c.browseJobs} <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </div>

          <form
            className="card-lift rounded-lg border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid) send.mutate();
            }}
          >
            <p className="section-label">{c.sendMessageLabel}</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold">{c.formTitle}</h2>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="c-name">{c.name}</Label>
                <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" required />
              </div>
              <div>
                <Label htmlFor="c-email">{c.email}</Label>
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
                <Label htmlFor="c-subject">{c.subject}</Label>
                <Input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="c-message">{c.message}</Label>
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
                {send.isPending ? c.sending : c.send}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
