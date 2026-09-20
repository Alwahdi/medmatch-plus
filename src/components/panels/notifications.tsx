import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useSession } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import {
  clearNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "@/lib/notifications";
import { WorkspaceHeading } from "@/components/workspace-ui";

const TXT = {
  ar: {
    title: "الإشعارات",
    sub: "كل ما يخص حسابك في مكان واحد",
    markAll: "تعليم الكل كمقروء",
    clear: "حذف الكل",
    empty: "لا توجد إشعارات",
     emptyBody: "ستصلك هنا إشعارات الدعوات والطلبات والتوثيق. الرسائل لها عداد مستقل.",
    settings: "الإعدادات",
  },
  en: {
    title: "Notifications",
    sub: "Everything about your account in one place",
    markAll: "Mark all as read",
    clear: "Clear all",
    empty: "No notifications",
     emptyBody: "Invitation, application and verification updates appear here. Messages have their own counter.",
    settings: "Settings",
  },
} as const;

export function NotificationsPanel({ embedded = false }: { embedded?: boolean }) {
  const { user } = useSession();
  const { lang } = useLang();
  const c = TXT[lang];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { items, unreadCount, isPending, isError, error, refetch } = useNotifications(user, 100);

  return (
    <div className={embedded ? "" : "mx-auto max-w-3xl px-4 py-10"}>
      {!embedded && <WorkspaceHeading title={c.title} description={c.sub} />}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!unreadCount}
          onClick={async () => {
            if (!user) return;
            await markAllNotificationsRead(user.id);
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
        >
          <CheckCheck className="size-4" /> {c.markAll}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!items.length}
          onClick={async () => {
            if (!user) return;
            await clearNotifications(user.id);
            void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }}
        >
          <Trash2 className="size-4" /> {c.clear}
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={Bell} title={c.empty} description={c.emptyBody} />
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={async () => {
                if (!n.read_at) {
                  await markNotificationRead(n.id);
                  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
                }
                if (n.link) void navigate({ to: n.link as never });
              }}
               className={`flex min-h-20 w-full flex-col gap-1 rounded-lg border border-border p-4 text-start shadow-card transition-colors hover:bg-secondary ${
                n.read_at ? "bg-card" : "bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-2">
                {!n.read_at && <span className="size-2 rounded-full bg-primary" />}
                <span className="font-bold">{lang === "ar" ? n.title_ar : n.title_en}</span>
              </div>
              {(lang === "ar" ? n.body_ar : n.body_en) && (
                <span className="text-sm text-muted-foreground">
                  {lang === "ar" ? n.body_ar : n.body_en}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDateTime(n.created_at, lang)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
