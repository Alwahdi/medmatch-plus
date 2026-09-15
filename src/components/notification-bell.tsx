import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import {
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
  type AppNotification,
} from "@/lib/notifications";

const TXT = {
  ar: {
    title: "الإشعارات",
    empty: "لا توجد إشعارات بعد",
    emptyBody: "ستصلك هنا تحديثات الدعوات والطلبات والتوثيق. للرسائل عداد مستقل.",
    markAll: "تعليم الكل كمقروء",
    clear: "حذف الكل",
    viewAll: "عرض كل الإشعارات",
    label: "الإشعارات",
  },
  en: {
    title: "Notifications",
    empty: "No notifications yet",
    emptyBody: "Invitation, application and verification updates appear here. Messages have a separate counter.",
    markAll: "Mark all as read",
    clear: "Clear all",
    viewAll: "View all notifications",
    label: "Notifications",
  },
} as const;

export function NotificationBell() {
  const { user } = useSession();
  const { lang } = useLang();
  const c = TXT[lang];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { items, unreadCount } = useNotifications(user, 15);

  if (!user) return null;

  async function onOpen(n: AppNotification) {
    setOpen(false);
    if (!n.read_at) {
      await markNotificationRead(n.id);
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (n.link) void navigate({ to: n.link });
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={c.label}>
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-bold">{c.title}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={c.markAll}
              title={c.markAll}
              disabled={!unreadCount}
              onClick={async () => {
                await markAllNotificationsRead(user!.id);
                void queryClient.invalidateQueries({ queryKey: ["notifications"] });
              }}
            >
              <CheckCheck className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={c.clear}
              title={c.clear}
              disabled={!items.length}
              onClick={async () => {
                await clearNotifications(user!.id);
                void queryClient.invalidateQueries({ queryKey: ["notifications"] });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <BellOff className="size-8 text-muted-foreground" />
              <p className="text-sm font-medium">{c.empty}</p>
              <p className="text-xs text-muted-foreground">{c.emptyBody}</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void onOpen(n)}
                className={`flex w-full flex-col gap-1 border-b border-border/60 px-3 py-2.5 text-start transition-colors hover:bg-secondary ${
                  n.read_at ? "" : "bg-primary/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  {!n.read_at && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  <span className="text-sm font-semibold">
                    {lang === "ar" ? n.title_ar : n.title_en}
                  </span>
                </div>
                {(lang === "ar" ? n.body_ar : n.body_en) && (
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {lang === "ar" ? n.body_ar : n.body_en}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {formatDateTime(n.created_at, lang)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild onClick={() => setOpen(false)}>
            <Link to="/notifications">{c.viewAll}</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
