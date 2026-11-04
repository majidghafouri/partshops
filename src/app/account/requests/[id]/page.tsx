import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Car,
  Clock,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  Store,
  User,
  Users,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCustomerRequest } from "@/lib/db";
import {
  OFFER_STATUS_CLASSES,
  OFFER_STATUS_LABELS,
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
  formatDate,
} from "@/lib/status";
import { formatPrice } from "@/lib/data";
import Countdown from "@/components/Countdown";
import LiveRefresh from "@/components/LiveRefresh";
import AcceptOfferButton from "@/components/AcceptOfferButton";
import RequestActions from "@/components/RequestActions";
import AttachmentGallery from "@/components/AttachmentGallery";

export const dynamic = "force-dynamic";

export default async function CustomerRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?next=/account/requests/${id}`);
  if (user.role === "SELLER") redirect("/seller/dashboard");
  if (user.role === "ADMIN") redirect(`/admin`);

  const request = await getCustomerRequest(id, user.id);
  if (!request) notFound();

  const accepted = request.acceptedOffer;
  const sortedOffers = [...request.offers].sort((a, b) => {
    if (a.status === "ACCEPTED") return -1;
    if (b.status === "ACCEPTED") return 1;
    return a.totalPrice + a.deliveryFee - (b.totalPrice + b.deliveryFee);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <LiveRefresh />
      <Link href="/account/requests" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4">
        <ArrowRight className="w-4 h-4" />
        بازگشت به درخواست‌ها
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black">
              {request.items.map((item) => item.title).join("، ")}
            </h1>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${REQUEST_STATUS_CLASSES[request.status]}`}>
              {REQUEST_STATUS_LABELS[request.status]}
            </span>
          </div>
          <p className="text-xs text-muted mt-1.5">
            ثبت شده در {formatDate(request.createdAt)} · {request.city ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {request.status === "OPEN" && (
            <div className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center">
              <p className="text-[10px] text-muted mb-1">زمان باقی‌مانده</p>
              <Countdown expiresAt={request.expiresAt} />
            </div>
          )}
          <RequestActions
            requestId={request.id}
            canCancel={request.status === "OPEN"}
            canConfirmDelivery={request.status === "SHIPPED"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              قطعات درخواستی
            </h2>
            <div className="mt-4 space-y-3">
              {request.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-background/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold">
                        <span className="text-muted">{item.category.icon ?? "🔧"} </span>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted mt-1">{item.category.name}</p>
                    </div>
                    <span className="rounded-lg bg-surface-hover px-2.5 py-1 text-[11px] font-bold">
                      × {new Intl.NumberFormat("fa-IR").format(item.quantity)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted">
                    {item.brand && <span>برند: {item.brand}</span>}
                    {item.partNumber && <span dir="ltr">کد فنی: {item.partNumber}</span>}
                    {item.description && <span className="col-span-2">توضیح: {item.description}</span>}
                    {item.notes && <span className="col-span-2">یادداشت: {item.notes}</span>}
                  </div>
                  <AttachmentGallery attachments={item.attachments} className="mt-3" />
                </div>
              ))}
            </div>
            {request.notes && (
              <p className="mt-4 rounded-xl bg-warning/5 border border-warning/20 p-3 text-xs text-muted">
                توضیحات کلی: {request.notes}
              </p>
            )}
            <AttachmentGallery attachments={request.attachments} className="mt-4" />
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                پیشنهادهای دریافتی
              </h2>
              <span className="text-[11px] text-muted">
                {new Intl.NumberFormat("fa-IR").format(request.offerCount)} پیشنهاد
              </span>
            </div>

            {sortedOffers.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="mt-3 text-sm font-bold">
                  {request.status === "OPEN" ? "در انتظار پیشنهاد فروشندگان" : "پیشنهادی ثبت نشده است"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {request.status === "OPEN"
                    ? "درخواست شما برای فروشندگان مرتبط ارسال شده است. صفحه به‌صورت خودکار به‌روزرسانی می‌شود."
                    : "برای این درخواست پیشنهادی دریافت نشد."}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {sortedOffers.map((offer) => {
                  const total = offer.totalPrice + offer.deliveryFee;
                  return (
                    <div
                      key={offer.id}
                      className={`rounded-xl border p-4 ${
                        offer.status === "ACCEPTED"
                          ? "border-success/40 bg-success/5"
                          : "border-border bg-background/50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-primary" />
                            <p className="text-sm font-bold">{offer.seller.shopName}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${OFFER_STATUS_CLASSES[offer.status]}`}>
                              {OFFER_STATUS_LABELS[offer.status]}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted mt-1">
                            {offer.seller.city ? `${offer.seller.city} · ` : ""}
                            امتیاز {new Intl.NumberFormat("fa-IR").format(offer.seller.rating)} از ۵
                            {offer.estimatedDeliveryHours
                              ? ` · آماده‌سازی ${new Intl.NumberFormat("fa-IR").format(offer.estimatedDeliveryHours)} ساعت`
                              : ""}
                          </p>
                          {offer.note && <p className="text-[11px] text-muted-foreground mt-2">{offer.note}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-black text-primary">{formatPrice(total)}</p>
                          <p className="text-[10px] text-muted">
                            قطعه {formatPrice(offer.totalPrice)}
                            {offer.deliveryFee > 0 ? ` + ارسال ${formatPrice(offer.deliveryFee)}` : " + ارسال رایگان"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <span className="text-[10px] text-muted">{formatDate(offer.createdAt)}</span>
                        {request.status === "OPEN" && offer.status === "PENDING" && (
                          <AcceptOfferButton offerId={offer.id} totalPrice={total} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              مشخصات خودرو
            </h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">برند / مدل</dt>
                <dd>{`${request.carMake ?? "—"} ${request.carModel ?? ""}`.trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">سال ساخت</dt>
                <dd>{request.carYear ? new Intl.NumberFormat("fa-IR").format(request.carYear) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">پلاک</dt>
                <dd>{request.plateNumber ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              اطلاعات تحویل
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{request.address}</p>
            <div className="mt-3 space-y-2 text-xs">
              <p className="flex items-center gap-2 text-muted">
                <User className="w-3.5 h-3.5" />
                {request.customer.name}
              </p>
              {request.phone && (
                <p className="flex items-center gap-2 text-muted" dir="ltr">
                  <Phone className="w-3.5 h-3.5" />
                  {request.phone}
                </p>
              )}
            </div>
          </section>

          {accepted && (
            <section className="rounded-2xl border border-success/30 bg-success/5 p-5">
              <h2 className="font-bold text-sm text-success">فروشنده انتخاب‌شده</h2>
              <p className="mt-3 text-sm font-bold">{accepted.seller.shopName}</p>
              <p className="mt-1 text-xs text-muted">
                {accepted.seller.city ?? "—"} · امتیاز {new Intl.NumberFormat("fa-IR").format(accepted.seller.rating)}
              </p>
              <p className="mt-2 text-sm font-black text-success">{formatPrice(accepted.totalPrice + accepted.deliveryFee)}</p>
              {accepted.seller.phone && (
                <a
                  href={`tel:${accepted.seller.phone}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-success/30 px-3 py-2 text-[11px] font-bold text-success"
                  dir="ltr"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {accepted.seller.phone}
                </a>
              )}
              <p className="mt-3 text-[10px] text-muted leading-relaxed">
                آدرس تحویل برای فروشنده ارسال شده است. پس از دریافت کالا، تحویل را تایید کنید.
              </p>
            </section>
          )}

          {request.status === "EXPIRED" && (
            <section className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
              <p className="text-sm font-bold text-warning">زمان درخواست تمام شد</p>
              <p className="mt-1 text-xs text-muted">می‌توانید همان قطعات را دوباره ثبت کنید.</p>
              <Link href="/request/new" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-primary">
                <PlusCircle className="w-4 h-4" />
                ثبت درخواست مجدد
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
