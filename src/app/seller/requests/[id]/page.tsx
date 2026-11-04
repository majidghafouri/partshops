import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  MapPin,
  Package,
  Phone,
  User,
  Users,
} from "lucide-react";
import { getSessionUser, isApprovedSeller } from "@/lib/auth";
import { getSellerRequest } from "@/lib/db";
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
import OfferForm from "@/components/OfferForm";
import SellerJobActions from "@/components/SellerJobActions";
import AttachmentGallery from "@/components/AttachmentGallery";

export const dynamic = "force-dynamic";

export default async function SellerRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/auth/login?next=/seller/requests/${id}`);
  if (user.role === "CUSTOMER") redirect("/account/requests");
  if (user.role === "ADMIN") redirect("/admin");
  if (!user.sellerProfileId) redirect("/auth/register?role=seller");

  const request = await getSellerRequest(id, user.sellerProfileId);
  if (!request) notFound();

  const approved = isApprovedSeller(user);
  const isAcceptedSeller = request.acceptedOffer?.isMine ?? false;
  const canOffer = approved && request.status === "OPEN";
  const myOffer = request.myOffer;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <LiveRefresh />
      <Link href="/seller/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4">
        <ArrowRight className="w-4 h-4" />
        بازگشت به پنل فروشنده
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black">{request.items.map((item) => item.title).join("، ")}</h1>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${REQUEST_STATUS_CLASSES[request.status]}`}>
              {REQUEST_STATUS_LABELS[request.status]}
            </span>
          </div>
          <p className="text-xs text-muted mt-1.5">
            ثبت شده در {formatDate(request.createdAt)} · {request.city ?? "—"}
          </p>
        </div>
        {request.status === "OPEN" && (
          <div className="rounded-xl border border-border bg-surface px-4 py-2.5 text-center">
            <p className="text-[10px] text-muted mb-1">زمان باقی‌مانده برای پیشنهاد</p>
            <Countdown expiresAt={request.expiresAt} />
          </div>
        )}
      </div>

      {!approved && (
        <div className="mb-5 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-xs text-warning flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          حساب فروشندگی شما تایید نشده است و امکان ارسال پیشنهاد ندارید.
        </div>
      )}

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
                توضیحات کلی مشتری: {request.notes}
              </p>
            )}
            <AttachmentGallery attachments={request.attachments} className="mt-4" />
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              وضعیت پیشنهاد شما
            </h2>
            {myOffer ? (
              <div className="mt-4 rounded-xl border border-border bg-background/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${OFFER_STATUS_CLASSES[myOffer.status]}`}>
                    {OFFER_STATUS_LABELS[myOffer.status]}
                  </span>
                  <p className="text-lg font-black text-primary">
                    {formatPrice(myOffer.totalPrice + myOffer.deliveryFee)}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted">
                  <span>قیمت قطعه: {formatPrice(myOffer.totalPrice)}</span>
                  <span>هزینه ارسال: {formatPrice(myOffer.deliveryFee)}</span>
                  {myOffer.estimatedDeliveryHours && (
                    <span>زمان آماده‌سازی: {new Intl.NumberFormat("fa-IR").format(myOffer.estimatedDeliveryHours)} ساعت</span>
                  )}
                  <span>ثبت: {formatDate(myOffer.createdAt)}</span>
                </div>
                {myOffer.note && <p className="mt-2 text-[11px] text-muted-foreground">{myOffer.note}</p>}
                {isAcceptedSeller && (
                  <div className="mt-3 rounded-lg bg-success/10 border border-success/20 p-3 text-[11px] text-success flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    پیشنهاد شما توسط مشتری پذیرفته شد.
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted">هنوز پیشنهادی برای این درخواست ارسال نکرده‌اید.</p>
            )}
          </section>

          <OfferForm requestId={request.id} existingOffer={myOffer} disabled={!canOffer} />

          {isAcceptedSeller && (
            <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <h2 className="font-bold text-sm text-accent">اقدامات سفارش</h2>
              <p className="mt-1 text-xs text-muted">
                پس از آماده‌سازی و تحویل بسته به شرکت حمل، ارسال را ثبت کنید.
              </p>
              <div className="mt-3">
                <SellerJobActions requestId={request.id} canShip={request.status === "ACCEPTED"} />
              </div>
              {request.status === "SHIPPED" && (
                <p className="mt-3 text-[11px] text-accent">سفارش ارسال شده است و در انتظار تایید تحویل توسط مشتری است.</p>
              )}
              {request.status === "DELIVERED" && (
                <p className="mt-3 text-[11px] text-success">تحویل سفارش توسط مشتری تایید شده است.</p>
              )}
            </section>
          )}
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
            {!isAcceptedSeller && (
              <p className="mt-3 rounded-lg bg-warning/5 border border-warning/20 p-2.5 text-[10px] text-warning leading-relaxed">
                آدرس و شماره تماس مشتری فقط پس از پذیرش پیشنهاد شما نمایش داده می‌شود.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="font-bold text-sm">رقابت پیشنهادها</h2>
            <p className="mt-3 text-2xl font-black text-primary">
              {new Intl.NumberFormat("fa-IR").format(request.offerCount)}
            </p>
            <p className="text-[11px] text-muted">پیشنهاد برای این درخواست ثبت شده است.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
