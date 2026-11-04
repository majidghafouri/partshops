"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Phone, Lock, Eye, EyeOff, ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import GoogleButton from "@/components/GoogleButton";

const GOOGLE_ERRORS: Record<string, string> = {
  google_failed: "ورود با گوگل ناموفق بود. دوباره تلاش کنید.",
  google_not_configured: "ورود با گوگل هنوز پیکربندی نشده است.",
  google_email_taken: "این ایمیل قبلاً با روش دیگری ثبت شده است. با رمز عبور وارد شوید.",
};

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || null;
  const googleError = searchParams.get("error");
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [method, setMethod] = useState<"email" | "phone">("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldError = (key: string) => fieldErrors[key];
  const fieldClass = (key: string, base: string) =>
    `${base} ${fieldError(key) ? "border-danger focus:border-danger focus:ring-danger" : ""}`;

  function redirectHome(role?: string) {
    if (nextUrl) {
      router.push(nextUrl);
    } else {
      router.push(
        role === "ADMIN" ? "/admin" : role === "SELLER" ? "/seller/dashboard" : "/account/requests"
      );
    }
    router.refresh();
  }

  function startCountdown(seconds: number) {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) clearInterval(timer);
        return c - 1;
      });
    }, 1000);
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در ورود");
        return;
      }
      redirectHome(data.user?.role);
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  async function handleOtpRequest() {
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در ارسال کد");
        return;
      }
      setOtpSent(true);
      startCountdown(60);
      setInfo(data.devCode ? `کد ارسال شده (توسعه): ${data.devCode}` : "کد یکبار مصرف ارسال شد");
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در تایید کد");
        return;
      }
      redirectHome(data.user?.role);
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center text-white font-black text-2xl mb-4">
            پ
          </div>
          <h1 className="text-2xl font-black">ورود به پارت شاپ</h1>
          <p className="text-sm text-muted mt-2">حساب کاربری خود را باز کنید</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6">
          {/* Mode tabs: password / OTP */}
          <div className="flex bg-surface-hover rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("password"); setError(null); setInfo(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "password" ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <Lock className="w-4 h-4" />
              ورود با رمز عبور
            </button>
            <button
              onClick={() => { setMode("otp"); setError(null); setInfo(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === "otp" ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              ورود با کد یکبار مصرف
            </button>
          </div>

          {(error || googleError) && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 text-sm mb-4">
              {error ?? (googleError ? GOOGLE_ERRORS[googleError] ?? "خطا در ورود با گوگل" : "")}
            </div>
          )}
          {info && (
            <div className="bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 text-sm mb-4" dir="ltr">
              {info}
            </div>
          )}

          {mode === "password" ? (
            <>
              {/* Method tabs */}
              <div className="flex bg-surface-hover rounded-xl p-1 mb-6">
                <button
                  onClick={() => setMethod("phone")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    method === "phone" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  شماره موبایل
                </button>
                <button
                  onClick={() => setMethod("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    method === "email" ? "bg-primary text-white" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  ایمیل
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    {method === "phone" ? "شماره موبایل" : "آدرس ایمیل"}
                  </label>
                  <div className="relative">
                    <input
                      type={method === "phone" ? "tel" : "email"}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={method === "phone" ? "۰۹۱۲۱۲۳۴۵۶۷" : "example@email.com"}
                      className={fieldClass(
                        "identifier",
                        "w-full h-12 pr-12 pl-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      )}
                      dir={method === "phone" ? "ltr" : "rtl"}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {method === "phone" ? <Phone className="w-4 h-4 text-muted" /> : <Mail className="w-4 h-4 text-muted" />}
                    </span>
                  </div>
                  {fieldError("identifier") && <p className="mt-1 text-[11px] text-danger">{fieldError("identifier")}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">رمز عبور</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="رمز عبور خود را وارد کنید"
                      className={fieldClass(
                        "password",
                        "w-full h-12 pr-12 pl-12 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                      )}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Lock className="w-4 h-4 text-muted" />
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldError("password") && <p className="mt-1 text-[11px] text-danger">{fieldError("password")}</p>}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                    <span className="text-muted-foreground">مرا به خاطر بسپار</span>
                  </label>
                  <button type="button" className="text-primary hover:text-primary-hover transition-colors">
                    فراموشی رمز عبور
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  ورود
                  {!saving && <ArrowLeft className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={otpSent ? handleOtpVerify : (e) => { e.preventDefault(); handleOtpRequest(); }} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">شماره موبایل</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                    disabled={otpSent}
                    className={fieldClass(
                      "phone",
                      "w-full h-12 pr-12 pl-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-60"
                    )}
                    dir="ltr"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Phone className="w-4 h-4 text-muted" />
                  </span>
                </div>
                {fieldError("phone") && <p className="mt-1 text-[11px] text-danger">{fieldError("phone")}</p>}
              </div>

              {otpSent && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">کد ۶ رقمی ارسال شده</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="۱۲۳۴۵۶"
                    className={fieldClass(
                      "code",
                      "w-full h-12 pr-4 pl-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors tracking-[0.5em] text-center"
                    )}
                    dir="ltr"
                  />
                  {fieldError("code") && <p className="mt-1 text-[11px] text-danger">{fieldError("code")}</p>}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || (otpSent ? countdown > 0 && false : countdown > 0)}
                className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {otpSent ? "تایید و ورود" : "دریافت کد یکبار مصرف"}
                {!saving && <ArrowLeft className="w-4 h-4" />}
              </button>

              {otpSent && (
                <button
                  type="button"
                  disabled={countdown > 0 || saving}
                  onClick={handleOtpRequest}
                  className="w-full text-sm text-muted hover:text-foreground disabled:opacity-50 transition-colors"
                >
                  {countdown > 0 ? `ارسال مجدد کد (${countdown} ثانیه)` : "ارسال مجدد کد"}
                </button>
              )}
            </form>
          )}

          {/* Google login */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">یا</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <GoogleButton next={nextUrl ?? undefined} />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-muted mt-6">
          حساب کاربری ندارید؟{" "}
          <Link href="/auth/register" className="text-primary hover:text-primary-hover font-medium transition-colors">
            ثبت‌نام کنید
          </Link>
        </p>
      </div>
    </div>
  );
}
