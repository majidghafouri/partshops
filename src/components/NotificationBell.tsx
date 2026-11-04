"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import type { NotificationView } from "@/lib/types";
import { formatDate } from "@/lib/status";

export default function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        unreadCount: number;
        notifications: NotificationView[];
      };
      setUnread(data.unreadCount);
      setNotifications(data.notifications.slice(0, 8));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    const interval = setInterval(load, 15000);
    const onRealtime = () => load();
    window.addEventListener("partshop:realtime", onRealtime);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      window.removeEventListener("partshop:realtime", onRealtime);
    };
  }, [load]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnread(0);
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
        className="relative p-2.5 rounded-xl hover:bg-surface-hover transition-colors"
        aria-label="اعلان‌ها"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 min-w-5 h-5 px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {new Intl.NumberFormat("fa-IR").format(unread)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-surface-elevated border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold">اعلان‌ها</span>
            <button
              onClick={markAllRead}
              disabled={loading || unread === 0}
              className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
              همه خوانده شد
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted">اعلانی ندارید</p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.requestId ? `/account/requests/${notification.requestId}` : "/notifications"}
                  onClick={() => setOpen(false)}
                  className={`block p-3 hover:bg-surface-hover transition-colors ${
                    notification.isRead ? "" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-xs font-bold line-clamp-1">{notification.title}</p>
                      <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-[9px] text-muted mt-1">{formatDate(notification.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs text-primary hover:text-primary-hover py-3 border-t border-border"
          >
            مشاهده همه اعلان‌ها
          </Link>
        </div>
      )}
    </div>
  );
}
