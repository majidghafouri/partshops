import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, PlusCircle } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getCategoryTree } from "@/lib/db";
import RequestForm from "./RequestForm";

export const metadata = {
  title: "ثبت درخواست قطعه | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function NewRequestPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/request/new");
  if (user.role !== "CUSTOMER") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-warning/10 text-warning flex items-center justify-center">
          <PlusCircle className="w-7 h-7" />
        </div>
        <h1 className="mt-4 text-xl font-black">ثبت درخواست فقط برای مشتریان</h1>
        <p className="mt-2 text-sm text-muted">
          حساب شما از نوع فروشنده است. برای ثبت درخواست قطعه از یک حساب مشتری استفاده کنید.
        </p>
        <Link href="/seller/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
          <ArrowRight className="w-4 h-4" />
          بازگشت به پنل فروشنده
        </Link>
      </div>
    );
  }

  const categories = await getCategoryTree();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">ثبت درخواست قطعه</h1>
        <p className="text-sm text-muted mt-1">
          مشخصات قطعه و خودرو را وارد کنید تا برای فروشندگان مرتبط ارسال شود.
        </p>
      </div>
      <Suspense>
        <RequestForm userId={user.id} categories={categories} defaultCity={user.city} defaultPhone={user.phone} />
      </Suspense>
    </div>
  );
}
