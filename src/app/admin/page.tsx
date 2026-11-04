import { redirect } from "next/navigation";
import {
  ClipboardList,
  ShieldCheck,
  Store,
  UserCheck,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import {
  getAdminRequests,
  getAdminSellers,
  getAdminStats,
  getCategoriesFlat,
} from "@/lib/db";
import {
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
  SELLER_STATUS_CLASSES,
  SELLER_STATUS_LABELS,
  formatDate,
} from "@/lib/status";
import LiveRefresh from "@/components/LiveRefresh";
import AdminSellerActions from "./AdminSellerActions";
import AdminCategoryManager from "./AdminCategoryManager";

export const metadata = {
  title: "پنل مدیریت | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/admin");
  if (user.role !== "ADMIN") redirect(user.role === "SELLER" ? "/seller/dashboard" : "/account/requests");

  const [stats, sellers, requests, categories] = await Promise.all([
    getAdminStats(),
    getAdminSellers(),
    getAdminRequests(20),
    getCategoriesFlat(),
  ]);

  const pending = sellers.filter((seller) => seller.status === "PENDING");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <LiveRefresh />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black">پنل مدیریت</h1>
          <p className="text-sm text-muted mt-1">فروشندگان، دسته‌بندی‌ها و درخواست‌های پلتفرم را مدیریت کنید.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-success/10 text-success px-3 py-1.5 text-[11px] font-bold">
          <ShieldCheck className="w-4 h-4" />
          دسترسی مدیر
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "فروشندگان فعال", value: stats.sellers, icon: Store, color: "text-success" },
          { label: "در انتظار تایید", value: stats.pendingSellers, icon: UserCheck, color: "text-warning" },
          { label: "درخواست‌های باز", value: stats.openRequests, icon: ClipboardList, color: "text-primary" },
          { label: "کل مشتریان", value: stats.customers, icon: Users, color: "text-accent" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <p className="mt-3 text-2xl font-black">{new Intl.NumberFormat("fa-IR").format(stat.value)}</p>
            <p className="text-[11px] text-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 mb-6">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-black">درخواست‌های تایید فروشنده</h2>
            <p className="text-xs text-muted mt-1">فروشندگان جدید پس از تایید به درخواست‌های مرتبط دسترسی پیدا می‌کنند.</p>
          </div>
          <span className="rounded-full bg-warning/10 text-warning px-2.5 py-1 text-[10px] font-bold">
            {new Intl.NumberFormat("fa-IR").format(pending.length)} در انتظار
          </span>
        </div>
        {pending.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">درخواست تایید جدیدی وجود ندارد.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((seller) => (
              <div key={seller.id} className="rounded-xl border border-border bg-background/50 p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{seller.shopName}</p>
                    <p className="text-[11px] text-muted mt-1">
                      {seller.user.name} · {seller.user.phone ?? seller.user.email ?? "—"} · {seller.city ?? "—"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {seller.categories.map(({ category }) => (
                        <span key={category.id} className="rounded bg-surface-hover px-2 py-0.5 text-[10px] text-muted">
                          {category.name}
                        </span>
                      ))}
                    </div>
                    {seller.description && <p className="mt-2 text-[11px] text-muted-foreground">{seller.description}</p>}
                  </div>
                  <AdminSellerActions sellerId={seller.id} status={seller.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-black mb-4">مدیریت دسته‌بندی‌ها</h2>
          <AdminCategoryManager categories={categories} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-black mb-4">همه فروشندگان</h2>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {sellers.map((seller) => (
              <div key={seller.id} className="rounded-xl border border-border bg-background/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold">{seller.shopName}</p>
                    <p className="text-[10px] text-muted mt-0.5">{seller.user.name}</p>
                    <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${SELLER_STATUS_CLASSES[seller.status]}`}>
                      {SELLER_STATUS_LABELS[seller.status]}
                    </span>
                  </div>
                  <AdminSellerActions sellerId={seller.id} status={seller.status} />
                </div>
                <p className="mt-2 text-[10px] text-muted">
                  {new Intl.NumberFormat("fa-IR").format(seller._count.offers)} پیشنهاد ·{" "}
                  {new Intl.NumberFormat("fa-IR").format(seller._count.acceptedRequests)} سفارش موفق
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-black">آخرین درخواست‌ها</h2>
          <span className="text-[11px] text-muted">{new Intl.NumberFormat("fa-IR").format(requests.length)} درخواست</span>
        </div>
        {requests.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">درخواستی ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted text-right">
                <tr className="border-b border-border">
                  <th className="py-2 px-2 font-medium">قطعات</th>
                  <th className="py-2 px-2 font-medium">مشتری</th>
                  <th className="py-2 px-2 font-medium">شهر</th>
                  <th className="py-2 px-2 font-medium">پیشنهاد</th>
                  <th className="py-2 px-2 font-medium">وضعیت</th>
                  <th className="py-2 px-2 font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 px-2 max-w-64">
                      <p className="truncate font-medium">{request.items.map((item) => item.title).join("، ")}</p>
                    </td>
                    <td className="py-2.5 px-2 text-muted">{request.customer.name}</td>
                    <td className="py-2.5 px-2 text-muted">{request.city ?? "—"}</td>
                    <td className="py-2.5 px-2">{new Intl.NumberFormat("fa-IR").format(request.offerCount)}</td>
                    <td className="py-2.5 px-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${REQUEST_STATUS_CLASSES[request.status]}`}>
                        {REQUEST_STATUS_LABELS[request.status]}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[10px] text-muted">{formatDate(request.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
