"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Phone, Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight, Store, Loader2, ClipboardList } from "lucide-react";
import GoogleButton from "@/components/GoogleButton";
import CategoryPicker from "@/components/CategoryPicker";
import type { Category } from "@/lib/types";

export default function RegisterClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [role, setRole] = useState<"customer" | "seller">(
    searchParams.get("role") === "seller" ? "seller" : "customer"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const fieldError = (key: string) => fieldErrors[key];
  const fieldClass = (key: string, base: string) =>
    `${base} ${fieldError(key) ? "border-danger focus:border-danger focus:ring-danger" : ""}`;
  const identifierField = method === "phone" ? "phone" : "email";
  const [form, setForm] = useState({
    name: "",
    identifier: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    shopPhone: "",
    city: "",
    address: "",
    description: "",
  });

  const isSeller = role === "seller";
  const steps = isSeller ? ["حساب کاربری", "اطلاعات فروشگاه"] : ["حساب کاربری"];
  const stepCount = steps.length;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "نام و نام خانوادگی را وارد کنید";
    if (!form.identifier.trim()) errors[identifierField] = method === "phone" ? "شماره موبایل را وارد کنید" : "آدرس ایمیل را وارد کنید";
    if (form.password.length < 8) errors.password = "رمز عبور باید حداقل ۸ کاراکتر باشد";
    if (form.password !== form.confirmPassword) errors.confirmPassword = "رمز عبور و تکرار آن یکسان نیست";
    if (isSeller) {
      if (!form.shopName.trim()) errors.shopName = "نام فروشگاه را وارد کنید";
      if (categoryIds.length === 0) errors.categoryIds = "حداقل یک دسته‌بندی انتخاب کنید";
    }
    if (!acceptedTerms) errors.terms = "پذیرش شرایط استفاده الزامی است";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("لطفاً خطاهای مشخص‌شده را اصلاح کنید");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: method === "email" ? form.identifier.trim() : undefined,
          phone: method === "phone" ? form.identifier.trim() : undefined,
          password: form.password,
          role: isSeller ? "SELLER" : "CUSTOMER",
          shopName: isSeller ? form.shopName : undefined,
          sellerPhone: isSeller ? form.shopPhone || undefined : undefined,
          city: form.city || undefined,
          address: isSeller ? form.address || undefined : undefined,
          description: isSeller ? form.description || undefined : undefined,
          categoryIds: isSeller ? categoryIds : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در ثبت‌نام");
        return;
      }
      router.push(isSeller ? "/seller/dashboard" : "/account/requests");
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  function goToSellerShopDetails() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "نام و نام خانوادگی را وارد کنید";
    if (!form.identifier.trim()) errors[identifierField] = method === "phone" ? "شماره موبایل را وارد کنید" : "آدرس ایمیل را وارد کنید";
    if (form.password.length < 8) errors.password = "رمز عبور باید حداقل ۸ کاراکتر باشد";
    if (form.password !== form.confirmPassword) errors.confirmPassword = "رمز عبور و تکرار آن یکسان نیست";
    if (!acceptedTerms) errors.terms = "پذیرش شرایط استفاده الزامی است";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("لطفاً خطاهای مشخص‌شده را اصلاح کنید");
      return;
    }
    setStep(2);
  }

  const inputClass =
    "w-full h-12 pr-12 pl-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  const roleOptions = [
    { value: "customer", label: "مشتری", icon: ClipboardList, desc: "ثبت درخواست قطعه مورد نیازم" },
    { value: "seller", label: "فروشنده", icon: Store, desc: "فروش قطعه‌های یدکی مورد نیاز" },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center text-white font-black text-2xl mb-4">
            پ
          </div>
          <h1 className="text-2xl font-black">ثبت‌نام در پارت شاپ</h1>
          <p className="text-sm text-muted mt-2">حساب کاربری جدید بسازید</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${((step - 1) / Math.max(stepCount - 1, 1)) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((label, index) => {
                const n = index + 1;
                const state = n < step ? "done" : n === step ? "active" : "todo";
                return (
                  <span
                    key={label}
                    className={`text-[11px] font-medium ${
                      state === "active" ? "text-primary" : state === "done" ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {n}. {label}
                  </span>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div key={step} className="animate-fade-in">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {roleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setRole(option.value as "customer" | "seller");
                          setStep(1);
                        }}
                        className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition-colors ${
                          role === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background/50 hover:border-border-hover"
                        }`}
                      >
                        <span
                          className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${
                            role === option.value ? "bg-primary text-white" : "bg-surface-hover text-muted"
                          }`}
                        >
                          <option.icon className="w-5 h-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-bold">{option.label}</span>
                          <span className="block text-[11px] text-muted mt-0.5">{option.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-surface-hover rounded-xl p-1 mb-6">
                    <button
                      type="button"
                      onClick={() => setMethod("phone")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        method === "phone" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      موبایل
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("email")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        method === "email" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      ایمیل
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">نام و نام خانوادگی *</label>
                      <div className="relative">
                        <input
                          value={form.name}
                          onChange={(event) => setForm({ ...form, name: event.target.value })}
                          placeholder="نام خود را وارد کنید"
                          className={fieldClass("name", inputClass)}
                        />
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      </div>
                      {fieldError("name") && <p className="mt-1 text-[11px] text-danger">{fieldError("name")}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">
                        {method === "phone" ? "شماره موبایل *" : "آدرس ایمیل *"}
                      </label>
                      <div className="relative">
                        <input
                          type={method === "phone" ? "tel" : "email"}
                          value={form.identifier}
                          onChange={(event) => setForm({ ...form, identifier: event.target.value })}
                          placeholder={method === "phone" ? "۰۹۱۲۱۲۳۴۵۶۷" : "example@email.com"}
                          className={fieldClass(identifierField, inputClass)}
                          dir={method === "phone" ? "ltr" : "rtl"}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2">
                          {method === "phone" ? <Phone className="w-4 h-4 text-muted" /> : <Mail className="w-4 h-4 text-muted" />}
                        </span>
                      </div>
                      {fieldError(identifierField) && <p className="mt-1 text-[11px] text-danger">{fieldError(identifierField)}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-2">رمز عبور *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={(event) => setForm({ ...form, password: event.target.value })}
                            placeholder="حداقل ۸ کاراکتر"
                            className={fieldClass(
                              "password",
                              "w-full h-12 pr-12 pl-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            )}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Lock className="w-4 h-4 text-muted" />
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {fieldError("password") && <p className="mt-1 text-[11px] text-danger">{fieldError("password")}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-2">تکرار رمز عبور *</label>
                        <div className="relative">
                          <input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                            placeholder="رمز عبور را مجدداً وارد کنید"
                            className={fieldClass(
                              "confirmPassword",
                              "w-full h-12 pr-12 pl-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            )}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Lock className="w-4 h-4 text-muted" />
                          </span>
                        </div>
                        {fieldError("confirmPassword") && <p className="mt-1 text-[11px] text-danger">{fieldError("confirmPassword")}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(event) => setAcceptedTerms(event.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-border accent-primary"
                        />
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          با <span className="text-primary">شرایط استفاده</span> و{" "}
                          <span className="text-primary">حریم خصوصی</span> موافقم
                        </span>
                      </label>
                      {fieldError("terms") && <p className="mt-1 text-[11px] text-danger">{fieldError("terms")}</p>}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && isSeller && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-background/50 p-4">
                    <p className="text-sm font-bold">اطلاعات فروشگاه</p>
                    <p className="text-[11px] text-muted mt-1 leading-relaxed">
                      این اطلاعات برای فعال‌سازی و تایید فروشنده شما ثبت می‌شود. می‌توانید بعداً در پنل فروشنده آن‌ها را به‌روزرسانی
                      کنید.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">نام فروشگاه *</label>
                      <div className="relative">
                        <input
                          value={form.shopName}
                          onChange={(event) => setForm({ ...form, shopName: event.target.value })}
                          placeholder="مثلاً یدک‌پارت"
                          className={fieldClass("shopName", inputClass)}
                        />
                        <Store className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      </div>
                      {fieldError("shopName") && <p className="mt-1 text-[11px] text-danger">{fieldError("shopName")}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">شماره تماس فروشگاه</label>
                      <div className="relative">
                        <input
                          value={form.shopPhone}
                          onChange={(event) => setForm({ ...form, shopPhone: event.target.value })}
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹۰"
                          className={fieldClass("shopPhone", inputClass)}
                          dir="ltr"
                        />
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">شهر</label>
                      <div className="relative">
                        <input
                          value={form.city}
                          onChange={(event) => setForm({ ...form, city: event.target.value })}
                          placeholder="شهر فعالیت"
                          className={fieldClass("city", inputClass)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">آدرس فروشگاه</label>
                      <div className="relative">
                        <input
                          value={form.address}
                          onChange={(event) => setForm({ ...form, address: event.target.value })}
                          placeholder="آدرس حضوری فروشگاه"
                          className={fieldClass("address", inputClass)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">توضیحات فروشگاه</label>
                      <textarea
                        value={form.description}
                        onChange={(event) => setForm({ ...form, description: event.target.value })}
                        placeholder="تخصص، برندها، شرایط ارسال..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-2">
                        دسته‌بندی قطعاتی که ارائه می‌دهید *
                      </label>
                      <CategoryPicker categories={categories} value={categoryIds} onChange={setCategoryIds} />
                      {fieldError("categoryIds") && <p className="mt-1 text-[11px] text-danger">{fieldError("categoryIds")}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {step === 1 ? (
              isSeller ? (
                <button
                  type="button"
                  onClick={goToSellerShopDetails}
                  disabled={saving}
                  className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  ادامه به اطلاعات فروشگاه
                  {!saving && <ArrowLeft className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  ثبت‌نام
                  {!saving && <ArrowLeft className="w-4 h-4" />}
                </button>
              )
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep((value) => value - 1)}
                  disabled={saving}
                  className="flex-1 h-12 border border-border hover:bg-surface-hover disabled:opacity-60 text-foreground rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  مرحله قبل
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-2 h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  ثبت‌نام فروشنده
                  {!saving && <ArrowLeft className="w-4 h-4" />}
                </button>
              </div>
            )}
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">یا</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <GoogleButton />
        </div>

        <p className="text-center text-sm text-muted mt-6">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/auth/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
            وارد شوید
          </Link>
        </p>
      </div>
    </div>
  );
}
