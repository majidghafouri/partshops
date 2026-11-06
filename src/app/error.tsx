"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-danger/10 flex items-center justify-center text-danger mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black">خطای غیرمنتظره</h1>
        <p className="text-sm text-muted mt-2">مشکلی پیش آمد. لطفاً دوباره تلاش کنید.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold hover:bg-surface-hover transition-colors"
          >
            <Home className="w-4 h-4" />
            صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}