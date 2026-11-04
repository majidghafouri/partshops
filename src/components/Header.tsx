"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  ClipboardList,
  Store,
  ShieldCheck,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Home,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import NotificationBell from "./NotificationBell";

export default function Header({ user, unreadCount = 0 }: { user: SessionUser | null; unreadCount?: number }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  const dashboardHref =
    user?.role === "ADMIN"
      ? "/admin"
      : user?.role === "SELLER"
        ? user?.sellerProfileId
          ? "/seller/dashboard"
          : "/seller/profile"
        : "/account/requests";

  const dashboardLabel =
    user?.role === "ADMIN" ? "پنل مدیریت" : user?.role === "SELLER" ? "پنل فروشنده" : "درخواست‌های من";

  const DashboardIcon = user?.role === "ADMIN" ? ShieldCheck : user?.role === "SELLER" ? Store : ClipboardList;

  return (
    <header className="sticky top-0 z-50 bg-surface/95 border-b border-border backdrop-blur-md">
      <div className="bg-primary/10 border-b border-border text-[11px] text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8">
          <span>قطعه مورد نیازتان را ثبت کنید؛ فروشندگان معتبر قیمت پیشنهاد می‌دهند.</span>
          {!user && (
            <Link href="/auth/register?role=seller" className="text-primary hover:text-primary-hover font-medium shrink-0">
              فروشنده شوید
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
              پ
            </div>
            <span className="text-xl font-bold hidden sm:block">پارت شاپ</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 mr-4 flex-1">
            <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-hover text-sm transition-colors">
              <Home className="w-4 h-4" />
              خانه
            </Link>
            <Link href="/request/new" className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-hover text-sm transition-colors">
              <PlusCircle className="w-4 h-4" />
              ثبت درخواست
            </Link>
            {user && (
              <Link href={dashboardHref} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-surface-hover text-sm transition-colors">
                <DashboardIcon className="w-4 h-4" />
                {dashboardLabel}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-1.5 mr-auto shrink-0">
            {user ? (
              <>
                <NotificationBell initialUnread={unreadCount} />
                <div
                  className="relative"
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-sm max-w-44">
                    <User className="w-5 h-5 shrink-0" />
                    <span className="truncate">{user.name}</span>
                    <ChevronDown className="w-3 h-3 shrink-0" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full left-0 w-52 bg-surface-elevated border border-border rounded-xl shadow-2xl py-2 mt-1 z-50">
                      <div className="px-4 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted truncate" dir="ltr">{user.phone ?? user.email}</p>
                      </div>
                      <Link href={dashboardHref} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover text-sm">
                        <DashboardIcon className="w-4 h-4" />
                        {dashboardLabel}
                      </Link>
                      {user.role === "SELLER" && user.sellerStatus !== "APPROVED" && (
                        <p className="mx-4 my-1 rounded-lg bg-warning/10 px-2 py-1.5 text-[10px] text-warning">
                          وضعیت فروشگاه: در انتظار تایید
                        </p>
                      )}
                      <Link href="/notifications" className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover text-sm">
                        <ClipboardList className="w-4 h-4" />
                        اعلان‌ها
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover text-sm text-danger"
                      >
                        <LogOut className="w-4 h-4" />
                        خروج از حساب
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-surface-hover transition-colors text-sm"
              >
                <User className="w-5 h-5" />
                <span>ورود | ثبت‌نام</span>
              </Link>
            )}

            <Link
              href={user?.role === "SELLER" ? "/seller/dashboard" : "/request/new"}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
            >
              {user?.role === "SELLER" ? <Store className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              {user?.role === "SELLER" ? "درخواست‌های مرتبط" : "ثبت درخواست"}
            </Link>

            <button
              onClick={() => setMobileOpen((value) => !value)}
              className="md:hidden p-2.5 rounded-xl hover:bg-surface-hover transition-colors"
              aria-label="منو"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface-elevated border-t border-border animate-slide-down">
          <div className="p-4 space-y-1.5">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover">
              <Home className="w-5 h-5" />
              خانه
            </Link>
            <Link href="/request/new" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover">
              <PlusCircle className="w-5 h-5" />
              ثبت درخواست
            </Link>
            {user ? (
              <>
                <Link href={dashboardHref} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover">
                  <DashboardIcon className="w-5 h-5" />
                  {dashboardLabel}
                </Link>
                <Link href="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover">
                  <ClipboardList className="w-5 h-5" />
                  اعلان‌ها
                  {unreadCount > 0 && (
                    <span className="mr-auto bg-danger text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                      {new Intl.NumberFormat("fa-IR").format(unreadCount)}
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover text-danger">
                  <LogOut className="w-5 h-5" />
                  خروج از حساب
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover">
                  <User className="w-5 h-5" />
                  ورود | ثبت‌نام
                </Link>
                <Link href="/auth/register?role=seller" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-hover">
                  <Store className="w-5 h-5" />
                  فروشنده شوید
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
