"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Store, Phone, MapPin, FileText, CheckCircle2 } from "lucide-react";
import CategoryPicker from "@/components/CategoryPicker";
import type { Category } from "@/lib/types";

export default function SellerProfileForm({
  categories,
  initial,
  creating = false,
}: {
  categories: Category[];
  initial: {
    shopName: string;
    description: string;
    phone: string;
    city: string;
    address: string;
    categoryIds: string[];
    status: string;
  };
  creating?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const fieldError = (key: string) => fieldErrors[key];
  const fieldClass = (key: string, base: string) =>
    `${base} ${fieldError(key) ? "border-danger focus:border-danger focus:ring-danger" : ""}`;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setMessage(null);
    if (!form.shopName.trim()) {
      setFieldErrors({ shopName: "نام فروشگاه را وارد کنید" });
      setError("لطفاً خطاهای مشخص‌شده را اصلاح کنید");
      return;
    }
    if (form.categoryIds.length === 0) {
      setFieldErrors({ categoryIds: "حداقل یک دسته‌بندی انتخاب کنید" });
      setError("لطفاً خطاهای مشخص‌شده را اصلاح کنید");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/seller/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: form.shopName,
          description: form.description,
          phone: form.phone,
          city: form.city,
          address: form.address,
          categoryIds: form.categoryIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در ذخیره اطلاعات");
        return;
      }
      setMessage(data.message || "اطلاعات ذخیره شد");
      if (creating || data.created) {
        router.push("/seller/dashboard");
      }
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  const selectedCount = form.categoryIds.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error && <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">{error}</div>}
      {message && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {message}
        </div>
      )}

      {form.status === "REJECTED" && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-[11px] text-warning leading-relaxed">
          پس از ذخیره تغییرات، درخواست شما دوباره برای بررسی مدیر ارسال می‌شود.
        </div>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Store className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-bold text-sm">اطلاعات فروشگاه</h2>
            <p className="text-[11px] text-muted">نام فروشگاه و راه‌های ارتباطی</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">نام فروشگاه *</label>
            <input
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              placeholder="مثلاً یدک‌پارت"
              className={fieldClass("shopName", inputClass)}
            />
            {fieldError("shopName") && <p className="mt-1 text-[11px] text-danger">{fieldError("shopName")}</p>}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">شماره تماس فروشگاه</label>
            <div className="relative">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className={fieldClass("phone", inputClass)}
                dir="ltr"
              />
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">شهر</label>
            <div className="relative">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="شهر فعالیت"
                className={fieldClass("city", inputClass)}
              />
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">آدرس</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="آدرس حضوری فروشگاه"
              className={fieldClass("address", inputClass)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">توضیحات</label>
            <div className="relative">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="تخصص، برندها، شرایط ارسال..."
                rows={3}
                className={fieldClass(
                  "description",
                  "w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                )}
              />
              <FileText className="absolute right-4 top-3 w-4 h-4 text-muted" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Store className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-bold text-sm">دسته‌بندی قطعات</h2>
              <p className="text-[11px] text-muted">قطعاتی که ارائه می‌دهید را انتخاب کنید</p>
            </div>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
            {new Intl.NumberFormat("fa-IR").format(selectedCount)} انتخاب‌شده
          </span>
        </div>
        <CategoryPicker categories={categories} value={form.categoryIds} onChange={(categoryIds) => setForm({ ...form, categoryIds })} />
        {fieldError("categoryIds") && <p className="mt-1 text-[11px] text-danger">{fieldError("categoryIds")}</p>}
      </section>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {creating ? "ذخیره و ادامه" : "ذخیره تغییرات"}
      </button>
    </form>
  );
}