import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "ثبت‌نام | پارت شاپ",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterClient />
    </Suspense>
  );
}