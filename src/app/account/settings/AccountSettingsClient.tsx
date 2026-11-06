"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Lock, User, MapPin, CheckCircle2 } from "lucide-react";

export default function AccountSettingsClient({
  initial,
}: {
  initial: { name: string; city: string; role: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [city, setCity] = useState(initial.city);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [pwdErr, setPwdErr] = useState<string | null>(null);

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-background border border-border text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileErr(data.error || "خطا در ذخیره اطلاعات");
        return;
      }
      setProfileMsg(data.message || "اطلاعات ذخیره شد");
      router.refresh();
    } catch {
      setProfileErr("خطا در برقراری ارتباط با سرور");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    setPwdErr(null);
    if (newPassword.length < 8) {
      setPwdErr("رمز عبور جدید باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdErr("رمز عبور جدید و تکرار آن یکسان نیست");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdErr(data.error || "خطا در تغییر رمز عبور");
        return;
      }
      setPwdMsg(data.message || "رمز عبور تغییر کرد");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPwdErr("خطا در برقراری ارتباط با سرور");
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <User className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-bold text-sm">اطلاعات شخصی</h2>
            <p className="text-[11px] text-muted">نام و شهر محل فعالیت</p>
          </div>
        </div>
        {profileErr && <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">{profileErr}</div>}
        {profileMsg && (
          <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {profileMsg}
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">نام و نام خانوادگی</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-muted-foreground mb-1.5">شهر</label>
            <div className="relative">
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              ذخیره اطلاعات
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </span>
          <div>
            <h2 className="font-bold text-sm">تغییر رمز عبور</h2>
            <p className="text-[11px] text-muted">برای امنیت، رمز عبور فعلی را وارد کنید</p>
          </div>
        </div>
        {pwdErr && <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">{pwdErr}</div>}
        {pwdMsg && (
          <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {pwdMsg}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">رمز عبور فعلی</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">رمز عبور جدید</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۸ کاراکتر"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">تکرار رمز عبور جدید</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="w-full h-12 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {savingPwd && <Loader2 className="w-4 h-4 animate-spin" />}
            <Lock className="w-4 h-4" />
            تغییر رمز عبور
          </button>
        </form>
      </section>
    </div>
  );
}