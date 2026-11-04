import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  MapPin,
  Package,
  Settings,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import {
  getAvailableRequestsForSeller,
  getSellerAcceptedRequests,
  getSellerOffers,
  getSellerProfileByUserId,
} from "@/lib/db";
import {
  OFFER_STATUS_CLASSES,
  OFFER_STATUS_LABELS,
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
  SELLER_STATUS_CLASSES,
  SELLER_STATUS_LABELS,
  formatDate,
} from "@/lib/status";
import { formatPrice } from "@/lib/data";
import Countdown from "@/components/Countdown";
import LiveRefresh from "@/components/LiveRefresh";

export const metadata = {
  title: "پنل فروشنده | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/seller/dashboard");
  if (user.role === "CUSTOMER") redirect("/account/requests");
  if (user.role === "ADMIN") redirect("/admin");
  if (!user.sellerProfileId) redirect("/auth/register?role=seller");

  const profile = await getSellerProfileByUserId(user.id);
  if (!profile) redirect("/auth/register?role=seller");

  const approved = profile.status === "APPROVED";
  const [available, offers, accepted] = approved
    ? await Promise.all([
        getAvailableRequestsForSeller(profile.id),
        getSellerOffers(profile.id),
        getSellerAcceptedRequests(profile.id),
      ])
    : [[], [], []];

  const pendingOffers = offers.filter((offer) => offer.status === "PENDING");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <LiveRefresh />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black">{profile.shopName}</h1>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${SELLER_STATUS_CLASSES[profile.status]}`}>
              {SELLER_STATUS_LABELS[profile.status]}
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            {profile.city ? `${profile.city} · ` : ""}پنل مدیریت درخواست‌ها و پیشنهادهای فروشگاه
          </p>
        </div>
        <Link
          href="/seller/profile"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-bold hover:bg-surface-hover transition-colors"
        >
          <Settings className="w-4 h-4" />
          ویرایش فروشگاه
        </Link>
      </div>

      {!approved && (
        <div
          className={`rounded-2xl border p-5 mb-6 ${
            profile.status === "PENDING"
              ? "border-warning/30 bg-warning/5"
              : "border-danger/30 bg-danger/5"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${profile.status === "PENDING" ? "text-warning" : "text-danger"}`} />
            <div>
              <p className="text-sm font-bold">
                {profile.status === "PENDING"
                  ? "فروشگاه شما در انتظار تایید مدیر است"
                  : profile.status === "REJECTED"
                    ? "درخواست فروشندگی شما تایید نشد"
                    : "دسترسی فروشندگی شما تعلیق شده است"}
              </p>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {profile.status === "PENDING"
                  ? "پس از بررسی اطلاعات و دسته‌بندی‌ها، حساب شما فعال می‌شود و درخواست‌های مرتبط را دریافت می‌کنید."
                  : profile.rejectionReason || "برای اطلاعات بیشتر با پشتیبانی تماس بگیرید."}
              </p>
              {profile.status === "REJECTED" && (
                <p className="mt-2 text-[11px] text-muted">
                  می‌توانید اطلاعات فروشگاه را ویرایش کنید و دوباره برای بررسی ارسال شود.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "درخواست‌های مرتبط", value: available.length, icon: ClipboardList, color: "text-primary" },
          { label: "پیشنهادهای فعال", value: pendingOffers.length, icon: Users, color: "text-accent" },
          { label: "سفارش‌های جاری", value: accepted.filter((item) => item.status !== "DELIVERED").length, icon: Truck, color: "text-warning" },
          { label: "کل پیشنهادها", value: offers.length, icon: Package, color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <p className="mt-3 text-2xl font-black">{new Intl.NumberFormat("fa-IR").format(stat.value)}</p>
            <p className="text-[11px] text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {approved && (
        <>
          <section className="mb-8">
            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <h2 className="text-lg font-black">درخواست‌های مرتبط</h2>
                <p className="text-xs text-muted mt-1">درخواست‌های باز در دسته‌بندی‌های فروشگاه شما.</p>
              </div>
            </div>
            {available.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center text-xs text-muted">
                در حال حاضر درخواست باز مرتبطی وجود ندارد. درخواست‌های جدید به‌صورت زنده نمایش داده می‌شوند.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {available.map((request) => (
                  <Link
                    key={request.id}
                    href={`/seller/requests/${request.id}`}
                    className="rounded-2xl border border-border bg-surface p-4 hover:border-primary/40 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                        {request.items.length} قطعه
                      </span>
                      <Countdown expiresAt={request.expiresAt} />
                    </div>
                    <p className="mt-2 text-sm font-bold line-clamp-2">
                      {request.items.map((item) => item.title).join("، ")}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {request.city ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {new Intl.NumberFormat("fa-IR").format(request.offerCount)} پیشنهاد
                      </span>
                      {request.myOffer ? (
                        <span className="text-success font-bold">پیشنهاد داده‌اید</span>
                      ) : (
                        <span className="text-primary font-bold flex items-center gap-1">
                          ارسال پیشنهاد
                          <ArrowLeft className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-lg font-black">پیشنهادهای من</h2>
              {offers.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted">هنوز پیشنهادی ارسال نکرده‌اید.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {offers.slice(0, 10).map((offer) => (
                    <Link
                      key={offer.id}
                      href={`/seller/requests/${offer.request.id}`}
                      className="block rounded-xl border border-border bg-background/50 p-3 hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {offer.request.items.map((item) => item.title).join("، ")}
                          </p>
                          <p className="text-[10px] text-muted mt-1">{formatDate(offer.createdAt)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${OFFER_STATUS_CLASSES[offer.status]}`}>
                          {OFFER_STATUS_LABELS[offer.status]}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-primary">{formatPrice(offer.totalPrice + offer.deliveryFee)}</span>
                        <span className="text-muted">{offer.request.city ?? "—"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-lg font-black">سفارش‌های پذیرفته‌شده</h2>
              {accepted.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted">هنوز سفارشی پذیرفته نشده است.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {accepted.map((request) => (
                    <Link
                      key={request.id}
                      href={`/seller/requests/${request.id}`}
                      className="block rounded-xl border border-border bg-background/50 p-3 hover:bg-surface-hover transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">
                            {request.items.map((item) => item.title).join("، ")}
                          </p>
                          <p className="text-[10px] text-muted mt-1">
                            {request.customer.name} · {request.city ?? "—"}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${REQUEST_STATUS_CLASSES[request.status]}`}>
                          {REQUEST_STATUS_LABELS[request.status]}
                        </span>
                      </div>
                      {request.acceptedOffer && (
                        <p className="mt-2 text-[11px] font-bold text-success">
                          {formatPrice(request.acceptedOffer.totalPrice + request.acceptedOffer.deliveryFee)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            دسته‌بندی‌های فروشگاه
          </h2>
          <Link href="/seller/profile" className="text-[11px] font-bold text-primary hover:text-primary-hover">
            ویرایش
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.categories.length === 0 ? (
            <p className="text-xs text-muted">دسته‌بندی‌ای انتخاب نشده است.</p>
          ) : (
            profile.categories.map(({ category }) => (
              <span key={category.id} className="rounded-lg bg-surface-hover px-3 py-1.5 text-[11px]">
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
