import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Settings } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import AccountSettingsClient from "./AccountSettingsClient";

export const metadata = {
  title: "تنظیمات حساب | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/account/settings");
  if (user.role === "ADMIN") redirect("/admin");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={user.role === "SELLER" ? "/seller/dashboard" : "/account/requests"} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4">
        <ArrowRight className="w-4 h-4" />
        بازگشت
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          تنظیمات حساب
        </h1>
        <p className="text-sm text-muted mt-1">اطلاعات شخصی و رمز عبور خود را مدیریت کنید.</p>
      </div>
      <AccountSettingsClient
        initial={{ name: user.name, city: user.city ?? "", role: user.role }}
      />
    </div>
  );
}