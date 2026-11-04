"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import type { OfferView } from "@/lib/types";

export default function OfferForm({
  requestId,
  existingOffer,
  disabled,
}: {
  requestId: string;
  existingOffer?: OfferView | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    totalPrice: existingOffer ? String(existingOffer.totalPrice) : "",
    deliveryFee: existingOffer ? String(existingOffer.deliveryFee) : "0",
    estimatedDeliveryHours: existingOffer?.estimatedDeliveryHours
      ? String(existingOffer.estimatedDeliveryHours)
      : "24",
    note: existingOffer?.note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const fieldError = (key: string) => fieldErrors[key];
  const fieldClass = (key: string, base: string) =>
    `${base} ${fieldError(key) ? "border-danger focus:border-danger focus:ring-danger" : ""}`;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    const errors: Record<string, string> = {};
    const totalPrice = Number(form.totalPrice);
    if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
      errors.totalPrice = "قیمت پیشنهادی را وارد کنید";
    }
    const deliveryFee = Number(form.deliveryFee) || 0;
    if (deliveryFee < 0) {
      errors.deliveryFee = "هزینه ارسال نمی‌تواند منفی باشد";
    }
    const estimatedDeliveryHours = form.estimatedDeliveryHours ? Number(form.estimatedDeliveryHours) : undefined;
    if (estimatedDeliveryHours !== undefined && (!Number.isFinite(estimatedDeliveryHours) || estimatedDeliveryHours <= 0)) {
      errors.estimatedDeliveryHours = "زمان آماده‌سازی باید بیشتر از صفر باشد";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("لطفاً خطاهای مشخص‌شده را اصلاح کنید");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalPrice,
          deliveryFee,
          estimatedDeliveryHours,
          note: form.note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در ثبت پیشنهاد");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  if (disabled) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-5 text-sm text-muted">
        زمان این درخواست به پایان رسیده یا بسته شده است و امکان ثبت پیشنهاد وجود ندارد.
      </div>
    );
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-bold text-sm">{existingOffer ? "ویرایش پیشنهاد" : "ارسال پیشنهاد"}</h2>
        <p className="text-xs text-muted mt-1">
          قیمت کل قطعه‌های درخواست و هزینه ارسال را وارد کنید.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-2.5 text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          پیشنهاد شما ثبت شد و به مشتری اطلاع داده شد.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">قیمت کل (تومان) *</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.totalPrice}
            onChange={(event) => setForm({ ...form, totalPrice: event.target.value })}
            placeholder="مثلاً 1250000"
            className={fieldClass("totalPrice", inputClass)}
            dir="ltr"
          />
          {fieldError("totalPrice") && <p className="mt-1 text-[11px] text-danger">{fieldError("totalPrice")}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">هزینه ارسال (تومان)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.deliveryFee}
            onChange={(event) => setForm({ ...form, deliveryFee: event.target.value })}
            placeholder="0"
            className={fieldClass("deliveryFee", inputClass)}
            dir="ltr"
          />
          {fieldError("deliveryFee") && <p className="mt-1 text-[11px] text-danger">{fieldError("deliveryFee")}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">زمان آماده‌سازی (ساعت)</label>
          <input
            type="number"
            inputMode="numeric"
            value={form.estimatedDeliveryHours}
            onChange={(event) => setForm({ ...form, estimatedDeliveryHours: event.target.value })}
            placeholder="24"
            className={fieldClass("estimatedDeliveryHours", inputClass)}
            dir="ltr"
          />
          {fieldError("estimatedDeliveryHours") && <p className="mt-1 text-[11px] text-danger">{fieldError("estimatedDeliveryHours")}</p>}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">توضیحات (اختیاری)</label>
          <input
            value={form.note}
            onChange={(event) => setForm({ ...form, note: event.target.value })}
            placeholder="برند، گارانتی، شرایط..."
            className={fieldClass("note", inputClass)}
          />
          {fieldError("note") && <p className="mt-1 text-[11px] text-danger">{fieldError("note")}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {existingOffer ? "به‌روزرسانی پیشنهاد" : "ثبت پیشنهاد"}
      </button>
    </form>
  );
}
