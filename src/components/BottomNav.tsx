"use client";

import Link from "next/link";
import { Home, ClipboardList, PlusCircle, Bell, User, Store, Settings } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export default function BottomNav({
  user,
  unreadCount = 0,
}: {
  user: SessionUser | null;
  unreadCount?: number;
}) {
  const isSeller = user?.role === "SELLER";
  const isAdmin = user?.role === "ADMIN";

  const items = user
    ? isSeller
      ? [
          { href: "/seller/dashboard", label: "پنل", icon: Store },
          { href: "/seller/requests", label: "درخواست‌ها", icon: ClipboardList },
          { href: "/notifications", label: "اعلان", icon: Bell, badge: unreadCount },
          { href: "/account/settings", label: "حساب", icon: User },
        ]
      : isAdmin
      ? [
          { href: "/admin", label: "مدیریت", icon: Settings },
          { href: "/notifications", label: "اعلان", icon: Bell, badge: unreadCount },
          { href: "/account/settings", label: "حساب", icon: User },
        ]
      : [
          { href: "/", label: "خانه", icon: Home },
          { href: "/account/requests", label: "درخواست‌ها", icon: ClipboardList },
          { href: "/request/new", label: "جدید", icon: PlusCircle, primary: true },
          { href: "/notifications", label: "اعلان", icon: Bell, badge: unreadCount },
          { href: "/account/settings", label: "حساب", icon: User },
        ]
    : [
        { href: "/", label: "خانه", icon: Home },
        { href: "/auth/login", label: "ورود", icon: User },
        { href: "/request/new", label: "درخواست", icon: PlusCircle, primary: true },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex items-stretch justify-around px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
                item.primary
                  ? "text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {item.primary ? (
                <span className="w-12 h-12 -mt-6 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                  <Icon className="w-6 h-6" />
                </span>
              ) : (
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -left-2 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
              )}
              <span className={item.primary ? "mt-1" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}