import Link from "next/link";
import { ArrowRight, Home, SearchX } from "lucide-react";

export const metadata = {
  title: "صفحه یافت نشد | پارت شاپ",
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-hover flex items-center justify-center text-muted mb-6">
          <SearchX className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black">۴۰۴</h1>
        <p className="text-sm text-muted mt-2">صفحه‌ای که دنبالش هستید پیدا نشد.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
          >
            <Home className="w-4 h-4" />
            صفحه اصلی
          </Link>
          <Link
            href="/request/new"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold hover:bg-surface-hover transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            ثبت درخواست
          </Link>
        </div>
      </div>
    </div>
  );
}