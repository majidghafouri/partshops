import { Suspense } from "react";
import RegisterClient from "./RegisterClient";
import { getCategoryTree } from "@/lib/db";

export const metadata = {
  title: "ثبت‌نام | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const categories = await getCategoryTree();
  return (
    <Suspense>
      <RegisterClient categories={categories} />
    </Suspense>
  );
}
