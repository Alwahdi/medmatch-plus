
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, BellRing, Trash2 } from "lucide-react";
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
import { useConfirm } from "@/components/confirm-dialog";
import { supabase } from "@/integrations/supabase/client";

import { useSession } from "@/lib/auth";
import { COUNTRIES, countryLabel, employmentLabel, specialtyName } from "@/lib/format";
import { Combobox, comboText } from "@/components/ui/combobox";
import { countryOptions, filterCityOptions } from "@/lib/geo";
import { EmptyState } from "@/components/empty-state";
import { useLang } from "@/lib/i18n";
import { getChannelStatus } from "@/lib/notifications.functions";
import { toastUndo } from "@/lib/undo";
import { ErrorState } from "@/components/error-state";
import { friendlyError, UserFacingError } from "@/lib/user-errors";


const ANY = "any";
type EmploymentType = "full_time" | "part_time" | "contract" | "locum" | "shift";

const EMPLOYMENT_KEYS: EmploymentType[] = ["full_time", "part_time", "contract", "locum", "shift"];

const TXT = {
  ar: {
    title: "تنبيهات الوظائف",
    sub: "حدّد تخصصك وموقعك، ونرسل لك الفرص الجديدة المطابقة أولاً بأول.",
    specialty: "التخصص",
    allSpecialties: "كل التخصصات",
    country: "الدولة",
    allCountries: "كل الدول",
    cityPh: "المدينة (اختياري)",
    employment: "نوع العمل",
    allTypes: "كل الأنواع",
    email: "عبر البريد الإلكتروني",
    whatsapp: "عبر واتساب",
    phonePh: "رقم واتساب بصيغة دولية مثل ‎+9665xxxxxxx",
    add: "أضف التنبيه",
    saving: "جارٍ الحفظ...",
    invalidPhone: "أدخل رقم واتساب صحيح بصيغة دولية",
    created: "تم إنشاء التنبيه",
    createFailed: "تعذّر إنشاء التنبيه",
    deleted: "تم حذف التنبيه",
    delete: "حذف",
    empty: "لم تنشئ أي تنبيه بعد.",
    channelWhatsapp: "واتساب",
    channelEmail: "بريد",
  },
  en: {
    title: "Job alerts",
    sub: "Set your specialty and location, and we'll send you matching new opportunities as they appear.",
    specialty: "Specialty",
    allSpecialties: "All specialties",
    country: "Country",
    allCountries: "All countries",
    cityPh: "City (optional)",
    employment: "Employment type",
    allTypes: "All types",
    email: "Via email",
    whatsapp: "Via WhatsApp",
    phonePh: "WhatsApp number in international format e.g. +9665xxxxxxx",
    add: "Add alert",
    saving: "Saving...",
    invalidPhone: "Enter a valid WhatsApp number in international format",
    created: "Alert created",
    createFailed: "Failed to create alert",
    deleted: "Alert deleted",
    delete: "Delete",
    empty: "You haven't created any alert yet.",
    channelWhatsapp: "WhatsApp",
    channelEmail: "Email",
  },
} as const;

export function AlertsPanel() {
  const { lang } = useLang();
  const cbx = comboText(lang);
  const c = TXT[lang];
  const { confirm, confirmDialog } = useConfirm();

  const { user } = useSession();
  const queryClient = useQueryClient();
  const [specialty, setSpecialty] = useState(ANY);
  const [country, setCountry] = useState(ANY);
  const [city, setCity] = useState("");
  const [employment, setEmployment] = useState(ANY);
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [phone, setPhone] = useState("");

  const { data: channels, isError: channelsErr, refetch: channelsRefetch } = useQuery({
    queryKey: ["alert-channels"],
    queryFn: () => getChannelStatus(),
    staleTime: 5 * 60_000,
  });

  const { data: specialties, isError: specialtiesErr, refetch: specialtiesRefetch } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("id,name_ar,name_en").order("name_ar");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: alerts, isError: alertsErr, refetch: alertsRefetch } = useQuery({
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
        throw new UserFacingError(c.invalidPhone);
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
      toast.success(c.created);
      setCity("");
      setPhone("");
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
    },
    onError: (e: Error) => toast.error(friendlyError(e, lang, c.createFailed)),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("job_alerts").update({ is_active }).eq("id", id);
      if (error) throw error;
      return { id, is_active };
    },
    onSuccess: ({ id, is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
      toastUndo(
        is_active
          ? lang === "ar" ? "تم تفعيل التنبيه" : "Alert turned on"
          : lang === "ar" ? "تم إيقاف التنبيه" : "Alert turned off",
        () => toggle.mutate({ id, is_active: !is_active }),
        lang,
      );
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(c.deleted);
      queryClient.invalidateQueries({ queryKey: ["job-alerts"] });
    },
  });

  const loadErrors = [
    { err: channelsErr, retry: channelsRefetch },
    { err: specialtiesErr, retry: specialtiesRefetch },
    { err: alertsErr, retry: alertsRefetch },
  ].filter((q) => q.err);
  if (loadErrors.length > 0)
    return (
      <ErrorState
        onRetry={() => {
          for (const q of loadErrors) void q.retry();
        }}
      />
    );
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {confirmDialog}

      <h1 className="font-display text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {c.sub}
      </p>

      {channels && !(channels.email && channels.whatsapp) && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          {lang === "ar"
            ? "تفضيلاتك تُحفظ الآن، ويبدأ الإرسال الفعلي فور تفعيل مزوّد الرسائل عند الإطلاق."
            : "Your preferences are saved now; actual delivery starts as soon as the messaging provider is activated at launch."}
        </div>
      )}

      <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-5 md:grid-cols-2">
        <Combobox
          options={[
            { value: ANY, label: c.allSpecialties },
            ...(specialties ?? []).map((s) => ({
              value: s.id,
              label: specialtyName(s, lang) ?? s.name_ar,
              keywords: [s.name_ar, s.name_en].filter(Boolean) as string[],
            })),
          ]}
          value={specialty}
          onChange={setSpecialty}
          placeholder={c.specialty}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
        />
        <Combobox
          options={[{ value: ANY, label: c.allCountries }, ...countryOptions(lang)]}
          value={country}
          onChange={(v) => { setCountry(v); setCity(""); }}
          placeholder={c.country}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
        />
        <Combobox
          options={filterCityOptions(country === ANY ? "" : country, lang)}
          value={city}
          onChange={setCity}
          placeholder={c.cityPh}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
          allowCustom
          customLabel={cbx.add}
        />
        <Combobox
          options={[
            { value: ANY, label: c.allTypes },
            ...EMPLOYMENT_KEYS.map((k) => ({
              value: k,
              label: employmentLabel(k, lang),
              keywords: [employmentLabel(k, "ar"), employmentLabel(k, "en")],
            })),
          ]}
          value={employment}
          onChange={setEmployment}
          placeholder={c.employment}
          searchPlaceholder={cbx.search}
          emptyText={cbx.empty}
        />
        <Select value={channel} onValueChange={(v) => setChannel(v as "email" | "whatsapp")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="email">{c.email}</SelectItem>
            <SelectItem value="whatsapp">{c.whatsapp}</SelectItem>
          </SelectContent>
        </Select>
        {channel === "whatsapp" && (
          <Input
            placeholder={c.phonePh}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}
        <Button className="md:col-span-2" onClick={() => create.mutate()} loading={create.isPending}>
          <BellRing className="size-4" /> {create.isPending ? c.saving : c.add}
        </Button>
      </div>

      {alertsPending && (
        <div className="mt-6">
          <ListSkeleton rows={2} />
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {alerts.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">
                {specialtyName(specialties?.find((s) => s.id === a.specialty_id), lang) || c.allSpecialties}
              </Badge>
              <Badge variant="outline">{a.country ? countryLabel(a.country, lang) : c.allCountries}</Badge>
              {a.city && <Badge variant="outline">{a.city}</Badge>}
              {a.employment_type && <Badge variant="outline">{employmentLabel(a.employment_type, lang)}</Badge>}
              <Badge variant="secondary">{a.channel === "whatsapp" ? c.channelWhatsapp : c.channelEmail}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={a.is_active}
                onCheckedChange={(v) => toggle.mutate({ id: a.id, is_active: v })}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={c.delete}
                onClick={async () => {
                  const ok = await confirm({
                    title: lang === "ar" ? "حذف هذا التنبيه؟" : "Delete this alert?",
                    description:
                      lang === "ar"
                        ? "لن تصلك بعد الآن إشعارات بالوظائف المطابقة لهذه المعايير."
                        : "You will stop receiving notifications for jobs matching these criteria.",
                    confirmLabel: lang === "ar" ? "نعم، احذف" : "Yes, delete",
                    destructive: true,
                  });
                  if (ok) remove.mutate(a.id);
                }}
              >
                <Trash2 className="size-4" />
              </Button>

            </div>
          </li>
        ))}
      </ul>

      {alertsErr ? (
        <ErrorState className="mt-6" onRetry={() => void alertsRefetch()} />
      ) : !alertsPending && !alerts.length ? (
        <EmptyState className="mt-6" icon={Bell} title={c.empty} />
      ) : null}
    </div>
  );
}
