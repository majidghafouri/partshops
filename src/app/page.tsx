import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ClipboardList,
  Clock,
  PlusCircle,
  Send,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCategoryTree, getCustomerRequests, getSellerProfileByUserId } from "@/lib/db";
import { REQUEST_STATUS_CLASSES, REQUEST_STATUS_LABELS, formatDate } from "@/lib/status";
import Countdown from "@/components/Countdown";
import LiveRefresh from "@/components/LiveRefresh";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  const categories = await getCategoryTree();
  const recentRequests = user?.role === "CUSTOMER" ? (await getCustomerRequests(user.id)).slice(0, 3) : [];
  const sellerProfile =
    user?.role === "SELLER" && user.sellerProfileId ? await getSellerProfileByUserId(user.id) : null;

  return (
    <div>
      {user && <LiveRefresh />}

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_45%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary">
              <BadgeCheck className="w-4 h-4" />
              بازار درخواست قطعات یدکی خودرو
            </span>
            <h1 className="mt-5 text-3xl md:text-5xl font-black leading-tight">
              قطعه مورد نیازت رو بگو،
              <span className="text-primary"> فروشنده‌ها قیمت می‌دن</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
              درخواست قطعه را ثبت کنید تا در کمتر از ۳۰ دقیقه از فروشندگان معتبر و تاییدشده، پیشنهاد قیمت دریافت کنید.
              بهترین پیشنهاد را انتخاب کنید و سفارش را پیگیری کنید.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/request/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                ثبت درخواست قطعه
              </Link>
              {!user && (
                <Link
                  href="/auth/register?role=seller"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold hover:bg-surface-hover transition-colors"
                >
                  <Store className="w-5 h-5" />
                  فروشنده شوید
                </Link>
              )}
              {user?.role === "CUSTOMER" && (
                <Link
                  href="/account/requests"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-bold hover:bg-surface-hover transition-colors"
                >
                  <ClipboardList className="w-5 h-5" />
                  درخواست‌های من
                </Link>
              )}
            </div>
          </div>

          {sellerProfile && (
            <div className="mt-10 max-w-xl rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{sellerProfile.shopName}</p>
                  <p className="text-xs text-muted mt-1">
                    وضعیت فروشگاه:{" "}
                    {sellerProfile.status === "APPROVED"
                      ? "تایید شده"
                      : sellerProfile.status === "PENDING"
                        ? "در انتظار تایید"
                        : sellerProfile.status === "REJECTED"
                          ? "رد شده"
                          : "تعلیق شده"}
                  </p>
                </div>
                <Link
                  href="/seller/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover"
                >
                  ورود به پنل
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: ClipboardList, title: "ثبت درخواست", text: "قطعه و مشخصات خودرو را وارد کنید." },
            { icon: Send, title: "دریافت پیشنهاد", text: "فروشندگان مرتبط قیمت پیشنهاد می‌دهند." },
            { icon: ShieldCheck, title: "انتخاب مطمئن", text: "فروشنده تاییدشده را انتخاب کنید." },
            { icon: Truck, title: "ارسال و تحویل", text: "سفارش را پیگیری و تحویل بگیرید." },
          ].map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-border">{new Intl.NumberFormat("fa-IR").format(index + 1)}</span>
              </div>
              <p className="mt-3 text-sm font-bold">{step.title}</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black">دسته‌بندی قطعات</h2>
            <p className="text-xs text-muted mt-1">دسته مورد نظر خود را انتخاب کنید و درخواست ثبت کنید.</p>
          </div>
          <Link href="/request/new" className="text-xs font-bold text-primary hover:text-primary-hover whitespace-nowrap">
            همه دسته‌ها
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/request/new?category=${category.slug}`}
              className="group rounded-2xl border border-border bg-surface p-4 hover:border-primary/40 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{category.icon ?? "🔧"}</span>
                <ArrowLeft className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
              </div>
              <p className="mt-3 text-sm font-bold">{category.name}</p>
              <p className="mt-1 text-[11px] text-muted">
                {category.children?.length
                  ? `${new Intl.NumberFormat("fa-IR").format(category.children.length)} زیردسته`
                  : `${new Intl.NumberFormat("fa-IR").format(category.sellerCount ?? 0)} فروشنده`}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {recentRequests.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-14">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-black">آخرین درخواست‌های شما</h2>
              <p className="text-xs text-muted mt-1">وضعیت و پیشنهادهای دریافتی را ببینید.</p>
            </div>
            <Link href="/account/requests" className="text-xs font-bold text-primary hover:text-primary-hover whitespace-nowrap">
              مشاهده همه
            </Link>
          </div>
          <div className="space-y-2">
            {recentRequests.map((request) => (
              <Link
                key={request.id}
                href={`/account/requests/${request.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">
                    {request.items.map((item) => item.title).join("، ")}
                  </p>
                  <p className="text-[11px] text-muted mt-1">
                    {request.city ?? "—"} · {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {request.status === "OPEN" && <Countdown expiresAt={request.expiresAt} />}
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${REQUEST_STATUS_CLASSES[request.status]}`}>
                    {REQUEST_STATUS_LABELS[request.status]}
                  </span>
                  <span className="text-[11px] text-muted inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {new Intl.NumberFormat("fa-IR").format(request.offerCount)} پیشنهاد
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-t border-border bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Clock, title: "پاسخ سریع", text: "درخواست شما ۳۰ دقیقه فعال می‌ماند تا فروشندگان فرصت قیمت‌دهی داشته باشند." },
            { icon: ShieldCheck, title: "فروشنده تاییدشده", text: "فقط فروشندگان احراز هویت‌شده به درخواست‌های مرتبط دسترسی دارند." },
            { icon: BadgeCheck, title: "انتخاب با شماست", text: "همه پیشنهادها را مقایسه کنید و بهترین قیمت و شرایط را انتخاب کنید." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-surface p-5">
              <item.icon className="w-5 h-5 text-primary" />
              <p className="mt-3 text-sm font-bold">{item.title}</p>
              <p className="mt-1 text-xs text-muted leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
