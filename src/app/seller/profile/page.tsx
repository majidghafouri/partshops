import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCategoryTree, getSellerProfileByUserId } from "@/lib/db";
import SellerProfileForm from "./SellerProfileForm";

export const metadata = {
  title: "ویرایش فروشگاه | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function SellerProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/seller/profile");
  if (user.role === "CUSTOMER") redirect("/account/requests");
  if (user.role === "ADMIN") redirect("/admin");
  if (!user.sellerProfileId) redirect("/auth/register?role=seller");

  const [profile, categories] = await Promise.all([
    getSellerProfileByUserId(user.id),
    getCategoryTree(),
  ]);
  if (!profile) redirect("/auth/register?role=seller");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/seller/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground mb-4">
        <ArrowRight className="w-4 h-4" />
        بازگشت به پنل فروشنده
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-black">ویرایش فروشگاه</h1>
        <p className="text-sm text-muted mt-1">اطلاعات و دسته‌بندی‌های فروشگاه خود را به‌روزرسانی کنید.</p>
      </div>
      <SellerProfileForm
        categories={categories}
        initial={{
          shopName: profile.shopName,
          description: profile.description ?? "",
          phone: profile.phone ?? "",
          city: profile.city ?? "",
          address: profile.address ?? "",
          categoryIds: profile.categories.map(({ category }) => category.id),
          status: profile.status,
        }}
      />
    </div>
  );
}
