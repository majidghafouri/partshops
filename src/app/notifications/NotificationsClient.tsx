"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { NotificationView } from "@/lib/types";
import { formatDate } from "@/lib/status";

export default function NotificationsClient({ initial }: { initial: NotificationView[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const visible = tab === "unread" ? items.filter((item) => !item.isRead) : items;
  const unreadCount = items.filter((item) => !item.isRead).length;

  async function markAll() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function markOne(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  const hrefFor = (notification: NotificationView) => {
    if (!notification.requestId) return null;
    if (notification.type.startsWith("SELLER")) return `/seller/requests/${notification.requestId}`;
    if (notification.type === "NEW_REQUEST") return `/seller/requests/${notification.requestId}`;
    return `/account/requests/${notification.requestId}`;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex bg-surface-hover rounded-xl p-1">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "all" ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            همه ({new Intl.NumberFormat("fa-IR").format(items.length)})
          </button>
          <button
            onClick={() => setTab("unread")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === "unread" ? "bg-primary text-white" : "text-muted hover:text-foreground"
            }`}
          >
            خوانده‌نشده ({new Intl.NumberFormat("fa-IR").format(unreadCount)})
          </button>
        </div>
        <button
          onClick={markAll}
          disabled={loading || unreadCount === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-[11px] font-bold hover:bg-surface-hover disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
          علامت‌گذاری همه به‌عنوان خوانده‌شده
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Bell className="w-7 h-7" />
          </div>
          <p className="mt-4 text-sm font-bold">اعلانی وجود ندارد</p>
          <p className="mt-1 text-xs text-muted">اعلان‌های مربوط به درخواست‌ها و پیشنهادها اینجا نمایش داده می‌شوند.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((notification) => {
            const href = hrefFor(notification);
            const content = (
              <div className={`rounded-2xl border p-4 transition-colors ${notification.isRead ? "border-border bg-surface" : "border-primary/30 bg-primary/5"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${notification.isRead ? "bg-border" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{notification.title}</p>
                    <p className="mt-1 text-xs text-muted leading-relaxed">{notification.message}</p>
                    <p className="mt-2 text-[10px] text-muted">{formatDate(notification.createdAt)}</p>
                  </div>
                </div>
              </div>
            );

            return href ? (
              <Link
                key={notification.id}
                href={href}
                onClick={() => !notification.isRead && markOne(notification.id)}
                className="block hover:opacity-90"
              >
                {content}
              </Link>
            ) : (
              <button
                key={notification.id}
                onClick={() => !notification.isRead && markOne(notification.id)}
                className="block w-full text-right"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
