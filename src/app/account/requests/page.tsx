import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, PlusCircle, Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCustomerRequests } from "@/lib/db";
import { REQUEST_STATUS_CLASSES, REQUEST_STATUS_LABELS, formatDate } from "@/lib/status";
import Countdown from "@/components/Countdown";
import LiveRefresh from "@/components/LiveRefresh";

export const metadata = {
  title: "درخواست‌های من | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function AccountRequestsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/account/requests");
  if (user.role === "SELLER") redirect("/seller/dashboard");
  if (user.role === "ADMIN") redirect("/admin");

  const requests = await getCustomerRequests(user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <LiveRefresh />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">درخواست‌های من</h1>
          <p className="text-sm text-muted mt-1">وضعیت درخواست‌ها و پیشنهادهای دریافتی را پیگیری کنید.</p>
        </div>
        <Link
          href="/request/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          درخواست جدید
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ClipboardList className="w-7 h-7" />
          </div>
          <p className="mt-4 text-sm font-bold">هنوز درخواستی ثبت نکرده‌اید</p>
          <p className="mt-1 text-xs text-muted">اولین درخواست قطعه خود را ثبت کنید تا پیشنهاد دریافت کنید.</p>
          <Link href="/request/new" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
            <PlusCircle className="w-4 h-4" />
            ثبت درخواست
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const accepted = request.acceptedOffer;
            return (
              <Link
                key={request.id}
                href={`/account/requests/${request.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${REQUEST_STATUS_CLASSES[request.status]}`}>
                        {REQUEST_STATUS_LABELS[request.status]}
                      </span>
                      {request.status === "OPEN" && <Countdown expiresAt={request.expiresAt} />}
                    </div>
                    <p className="mt-2 text-sm font-bold truncate">
                      {request.items.map((item) => `${item.title} × ${new Intl.NumberFormat("fa-IR").format(item.quantity)}`).join("، ")}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {request.carMake || request.carModel
                        ? `${request.carMake ?? ""} ${request.carModel ?? ""}`.trim()
                        : "بدون مشخصات خودرو"}{" "}
                      · {request.city ?? "—"} · {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-black text-primary">
                        {new Intl.NumberFormat("fa-IR").format(request.offerCount)}
                      </p>
                      <p className="text-[10px] text-muted flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        پیشنهاد
                      </p>
                    </div>
                    {accepted && (
                      <div className="text-center">
                        <p className="text-sm font-bold text-success">
                          {new Intl.NumberFormat("fa-IR").format(accepted.totalPrice + accepted.deliveryFee)}
                        </p>
                        <p className="text-[10px] text-muted">تومان نهایی</p>
                      </div>
                    )}
                    <ArrowLeft className="w-4 h-4 text-muted" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
