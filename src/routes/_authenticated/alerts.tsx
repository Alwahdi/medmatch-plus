import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BellRing, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { COUNTRIES, EMPLOYMENT_LABELS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "تنبيهات الوظائف | SyndeoCare" },
      {
        name: "description",
        content: "فعّل تنبيهات الوظائف والمناوبات حسب تخصصك ومدينتك عبر البريد أو واتساب.",
      },
      { property: "og:title", content: "تنبيهات الوظائف | SyndeoCare" },
      { property: "og:description", content: "تنبيهات فورية للفرص المناسبة لتخصصك." },
    ],
  }),
  component: AlertsPage,
});

const ANY = "any";
type EmploymentType = "full_time" | "part_time" | "contract" | "locum" | "shift";

function AlertsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [specialty, setSpecialty] = useState(ANY);
  const [country, setCountry] = useState(ANY);
  const [city, setCity] = useState("");
  const [employment, setEmployment] = useState(ANY);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [phone, setPhone] = useState("");

  const { data: specialties } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("id,name_ar").order("name_ar");
      return data ?? [];
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["job-alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (channel === "whatsapp" && !/^\+?\d{8,15}$/.test(phone.trim())) {
        throw new Error("أدخل رقم واتساب صحيح بصيغة دولية");
      }
      const { error } = await supabase.from("job_alerts").insert({
        user_id: user!.id,
        specialty_id: specialty === ANY ? null : specialty,
        country: country === ANY ? null : country,
        city: city.trim() || null,
        employment_type: employment === ANY ? null : (employment as EmploymentType),
        channel,
        whatsapp_phone: channel === "whatsapp" ? phone.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إنشاء التنبيه");
      setCity("");
      setPhone("");
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
    },
    onError: (e: Error) => toast.error(e.message || "تعذّر إنشاء التنبيه"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("job_alerts").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-alerts"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حذف التنبيه");
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-extrabold">تنبيهات الوظائف</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        حدّد تخصصك وموقعك، ونرسل لك الفرص الجديدة المطابقة أولاً بأول.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger><SelectValue placeholder="التخصص" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>كل التخصصات</SelectItem>
            {specialties?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger><SelectValue placeholder="الدولة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>كل الدول</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="المدينة (اختياري)" value={city} onChange={(e) => setCity(e.target.value)} />
        <Select value={employment} onValueChange={setEmployment}>
          <SelectTrigger><SelectValue placeholder="نوع العمل" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>كل الأنواع</SelectItem>
            {Object.entries(EMPLOYMENT_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={(v) => setChannel(v as "email" | "whatsapp")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="email">عبر البريد الإلكتروني</SelectItem>
            <SelectItem value="whatsapp">عبر واتساب</SelectItem>
          </SelectContent>
        </Select>
        {channel === "whatsapp" && (
          <Input
            placeholder="رقم واتساب بصيغة دولية مثل ‎+9665xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}
        <Button className="md:col-span-2" onClick={() => create.mutate()} disabled={create.isPending}>
          <BellRing className="size-4" /> {create.isPending ? "جارٍ الحفظ..." : "أضف التنبيه"}
        </Button>
      </div>

      <ul className="mt-6 space-y-3">
        {alerts?.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">
                {specialties?.find((s) => s.id === a.specialty_id)?.name_ar ?? "كل التخصصات"}
              </Badge>
              <Badge variant="outline">{a.country ?? "كل الدول"}</Badge>
              {a.city && <Badge variant="outline">{a.city}</Badge>}
              {a.employment_type && <Badge variant="outline">{EMPLOYMENT_LABELS[a.employment_type]}</Badge>}
              <Badge variant="secondary">{a.channel === "whatsapp" ? "واتساب" : "بريد"}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={a.is_active}
                onCheckedChange={(v) => toggle.mutate({ id: a.id, is_active: v })}
              />
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(a.id)} aria-label="حذف">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {!alerts?.length && (
        <p className="mt-6 text-sm text-muted-foreground">لم تنشئ أي تنبيه بعد.</p>
      )}
    </div>
  );
}
