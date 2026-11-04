"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import CategoryPicker from "@/components/CategoryPicker";
import type { Category } from "@/lib/types";

export default function SellerProfileForm({
  categories,
  initial,
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
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 text-sm">{message}</div>}

      {form.status === "REJECTED" && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-[11px] text-warning leading-relaxed">
          پس از ذخیره تغییرات، درخواست شما دوباره برای بررسی مدیر ارسال می‌شود.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-bold text-sm">اطلاعات فروشگاه</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">نام فروشگاه *</label>
            <input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} className={fieldClass("shopName", inputClass)} />
            {fieldError("shopName") && <p className="mt-1 text-[11px] text-danger">{fieldError("shopName")}</p>}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">شماره تماس فروشگاه</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass("phone", inputClass)} dir="ltr" />
            {fieldError("phone") && <p className="mt-1 text-[11px] text-danger">{fieldError("phone")}</p>}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">شهر</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={fieldClass("city", inputClass)} />
            {fieldError("city") && <p className="mt-1 text-[11px] text-danger">{fieldError("city")}</p>}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">آدرس</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={fieldClass("address", inputClass)} />
            {fieldError("address") && <p className="mt-1 text-[11px] text-danger">{fieldError("address")}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">توضیحات</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={fieldClass(
              "description",
              "w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            )}
          />
          {fieldError("description") && <p className="mt-1 text-[11px] text-danger">{fieldError("description")}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-bold text-sm">دسته‌بندی قطعات</h2>
        <CategoryPicker categories={categories} value={form.categoryIds} onChange={(categoryIds) => setForm({ ...form, categoryIds })} />
        {fieldError("categoryIds") && <p className="mt-1 text-[11px] text-danger">{fieldError("categoryIds")}</p>}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        ذخیره تغییرات
      </button>
    </form>
  );
}
