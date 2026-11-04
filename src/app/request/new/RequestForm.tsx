"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, Send, Trash2, Clock, ShieldCheck, Paperclip } from "lucide-react";
import type { Category } from "@/lib/types";
import type { UploadedMedia } from "@/lib/upload";
import ImageUploader from "@/components/ImageUploader";
import VoiceRecorder from "@/components/VoiceRecorder";
import VideoUploader from "@/components/VideoUploader";

interface ItemInput {
  key: string;
  categoryId: string;
  title: string;
  brand: string;
  partNumber: string;
  quantity: string;
  description: string;
  notes: string;
  images: UploadedMedia[];
}

function makeItem(categoryId = ""): ItemInput {
  return {
    key: crypto.randomUUID(),
    categoryId,
    title: "",
    brand: "",
    partNumber: "",
    quantity: "1",
    description: "",
    notes: "",
    images: [],
  };
}

export default function RequestForm({
  userId,
  categories,
  defaultCity,
  defaultPhone,
}: {
  userId: string;
  categories: Category[];
  defaultCity?: string | null;
  defaultPhone?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategoryId = useMemo(() => {
    const slug = searchParams.get("category");
    if (!slug) return "";
    for (const parent of categories) {
      if (parent.slug === slug) return parent.id;
      const child = parent.children?.find((item) => item.slug === slug);
      if (child) return child.id;
    }
    return "";
  }, [categories, searchParams]);

  const [items, setItems] = useState<ItemInput[]>([makeItem(initialCategoryId)]);
  const [form, setForm] = useState({
    city: defaultCity ?? "",
    address: "",
    phone: defaultPhone ?? "",
    carMake: "",
    carModel: "",
    carYear: "",
    plateNumber: "",
    notes: "",
  });
  const [attachments, setAttachments] = useState<{
    audio: UploadedMedia | null;
    video: UploadedMedia | null;
  }>({ audio: null, video: null });
  const [saving, setSaving] = useState(false);
  const [busyCount, setBusyCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mediaBusy = busyCount > 0;
  const fieldError = (key: string) => fieldErrors[key];
  const setMediaBusy = (busy: boolean) =>
    setBusyCount((current) => Math.max(0, current + (busy ? 1 : -1)));

  function updateItem(key: string, patch: Partial<ItemInput>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((current) => [...current, makeItem()]);
  }

  function removeItem(key: string) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.key !== key)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mediaBusy) {
      setError("لطفاً تا پایان بارگذاری فایل‌ها صبر کنید");
      return;
    }

    const errors: Record<string, string> = {};
    items.forEach((item, index) => {
      const prefix = `items.${index}`;
      if (!item.categoryId) errors[`${prefix}.categoryId`] = "دسته‌بندی را انتخاب کنید";
      if (item.title.trim().length < 2) errors[`${prefix}.title`] = "نام قطعه را وارد کنید";
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        errors[`${prefix}.quantity`] = "تعداد باید بین ۱ تا ۹۹ باشد";
      }
    });

    if (form.address.trim().length < 5) {
      errors.address = "آدرس تحویل را کامل وارد کنید";
    }
    if (form.phone.trim() && !/^09\d{9}$/.test(form.phone.trim())) {
      errors.phone = "شماره تماس باید ۱۱ رقم و با ۰۹ شروع شود";
    }
    if (form.carYear.trim()) {
      const year = Number(form.carYear);
      if (!Number.isInteger(year) || year < 1300 || year > new Date().getFullYear() + 1) {
        errors.carYear = "سال ساخت معتبر نیست؛ سال شمسی یا میلادی را درست وارد کنید";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("لطفاً خطاهای مشخص‌شده را اصلاح کنید");
      return;
    }

    setFieldErrors({});
    setSaving(true);
    try {
      const requestAttachments = [attachments.audio, attachments.video]
        .filter((item): item is UploadedMedia => Boolean(item))
        .map((item) => ({
          pathname: item.pathname,
          kind: item.kind,
          durationSeconds: item.durationSeconds,
        }));

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            categoryId: item.categoryId,
            title: item.title.trim(),
            brand: item.brand.trim() || undefined,
            partNumber: item.partNumber.trim() || undefined,
            quantity: Number(item.quantity) || 1,
            description: item.description.trim() || undefined,
            notes: item.notes.trim() || undefined,
            attachments: item.images.map((image) => ({
              pathname: image.pathname,
              kind: image.kind,
              durationSeconds: image.durationSeconds,
            })),
          })),
          attachments: requestAttachments,
          city: form.city.trim() || undefined,
          address: form.address.trim(),
          phone: form.phone.trim() || undefined,
          carMake: form.carMake.trim() || undefined,
          carModel: form.carModel.trim() || undefined,
          carYear: form.carYear ? Number(form.carYear) : undefined,
          plateNumber: form.plateNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در ثبت درخواست");
        return;
      }
      router.push(`/account/requests/${data.request.id}`);
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const fieldInputClass = (key: string) =>
    `${inputClass} ${fieldError(key) ? "border-danger focus:border-danger focus:ring-danger" : ""}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm">قطعات مورد نیاز</h2>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن قطعه
          </button>
        </div>

        {items.map((item, index) => (
          <div key={item.key} className="rounded-xl border border-border bg-background/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted">قطعه {new Intl.NumberFormat("fa-IR").format(index + 1)}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="text-danger hover:text-danger/80 p-1"
                  aria-label="حذف قطعه"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">دسته‌بندی *</label>
                <select
                  value={item.categoryId}
                  onChange={(event) => updateItem(item.key, { categoryId: event.target.value })}
                  className={fieldInputClass(`items.${index}.categoryId`)}
                >
                  <option value="">انتخاب دسته‌بندی</option>
                  {categories.map((parent) => (
                    <optgroup key={parent.id} label={`${parent.icon ?? ""} ${parent.name}`}>
                      <option value={parent.id}>{parent.name} (همه)</option>
                      {parent.children?.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {fieldError(`items.${index}.categoryId`) && (
                  <p className="mt-1 text-[11px] text-danger">{fieldError(`items.${index}.categoryId`)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">نام قطعه *</label>
                <input
                  value={item.title}
                  onChange={(event) => updateItem(item.key, { title: event.target.value })}
                  placeholder="مثلاً لنت ترمز جلو"
                  className={fieldInputClass(`items.${index}.title`)}
                />
                {fieldError(`items.${index}.title`) && (
                  <p className="mt-1 text-[11px] text-danger">{fieldError(`items.${index}.title`)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">برند / سازنده</label>
                <input
                  value={item.brand}
                  onChange={(event) => updateItem(item.key, { brand: event.target.value })}
                  placeholder="مثلاً ایساکو"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">شماره فنی قطعه</label>
                <input
                  value={item.partNumber}
                  onChange={(event) => updateItem(item.key, { partNumber: event.target.value })}
                  placeholder="اختیاری"
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">تعداد</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={item.quantity}
                  onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                  className={fieldInputClass(`items.${index}.quantity`)}
                  dir="ltr"
                />
                {fieldError(`items.${index}.quantity`) && (
                  <p className="mt-1 text-[11px] text-danger">{fieldError(`items.${index}.quantity`)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">توضیح کوتاه</label>
                <input
                  value={item.description}
                  onChange={(event) => updateItem(item.key, { description: event.target.value })}
                  placeholder="اصالت، گارانتی، مدل..."
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">یادداشت برای فروشنده</label>
              <input
                value={item.notes}
                onChange={(event) => updateItem(item.key, { notes: event.target.value })}
                placeholder="اختیاری"
                className={inputClass}
              />
            </div>
            <ImageUploader
              userId={userId}
              value={item.images}
              onChange={(images) => updateItem(item.key, { images })}
              onBusyChange={setMediaBusy}
              error={fieldError(`items.${index}.attachments`)}
            />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="font-bold text-sm">مشخصات خودرو</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">برند خودرو</label>
            <input
              value={form.carMake}
              onChange={(event) => setForm({ ...form, carMake: event.target.value })}
              placeholder="مثلاً ایران‌خودرو"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">مدل خودرو</label>
            <input
              value={form.carModel}
              onChange={(event) => setForm({ ...form, carModel: event.target.value })}
              placeholder="مثلاً سمند EF7"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">سال ساخت (شمسی یا میلادی)</label>
            <input
              type="number"
              value={form.carYear}
              onChange={(event) => setForm({ ...form, carYear: event.target.value })}
              placeholder="مثلاً 1398 یا 2019"
              className={fieldInputClass("carYear")}
              dir="ltr"
            />
            {fieldError("carYear") && (
              <p className="mt-1 text-[11px] text-danger">{fieldError("carYear")}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">شماره پلاک</label>
            <input
              value={form.plateNumber}
              onChange={(event) => setForm({ ...form, plateNumber: event.target.value })}
              placeholder="اختیاری"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-sm">فایل‌های پیوست</h2>
        </div>
        <p className="text-xs text-muted">
          می‌توانید یک پیام صوتی و یک ویدیو کوتاه (حداکثر ۲۰ ثانیه) برای توضیح بهتر قطعه پیوست کنید.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <VoiceRecorder
            userId={userId}
            value={attachments.audio}
            onChange={(audio) => setAttachments((current) => ({ ...current, audio }))}
            onBusyChange={setMediaBusy}
            error={fieldError("attachments")}
          />
          <VideoUploader
            userId={userId}
            value={attachments.video}
            onChange={(video) => setAttachments((current) => ({ ...current, video }))}
            onBusyChange={setMediaBusy}
            error={fieldError("attachments")}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <h2 className="font-bold text-sm">اطلاعات تحویل</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">شهر</label>
            <input
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              placeholder="شهر تحویل"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">شماره تماس</label>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              className={fieldInputClass("phone")}
              dir="ltr"
            />
            {fieldError("phone") && (
              <p className="mt-1 text-[11px] text-danger">{fieldError("phone")}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">آدرس تحویل *</label>
          <textarea
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
            placeholder="آدرس کامل برای ارسال قطعه"
            rows={2}
            className={`w-full px-4 py-3 rounded-xl bg-background border text-sm focus:outline-none focus:ring-1 resize-none ${
              fieldError("address")
                ? "border-danger focus:border-danger focus:ring-danger"
                : "border-border focus:border-primary focus:ring-primary"
            }`}
          />
          {fieldError("address") && (
            <p className="mt-1 text-[11px] text-danger">{fieldError("address")}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">توضیحات کلی</label>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="هر توضیح دیگری که برای فروشندگان مفید است"
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span>درخواست شما به مدت ۳۰ دقیقه برای فروشندگان مرتبط فعال است و در این بازه می‌توانند قیمت پیشنهاد دهند. با پذیرش یک پیشنهاد، درخواست بسته می‌شود.</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-success">
          <ShieldCheck className="w-4 h-4" />
          فروشندگان تاییدشده
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || mediaBusy}
        className="w-full h-14 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saving || mediaBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        {mediaBusy ? "در حال بارگذاری فایل‌ها..." : "ثبت درخواست و دریافت پیشنهاد"}
      </button>
    </form>
  );
}
