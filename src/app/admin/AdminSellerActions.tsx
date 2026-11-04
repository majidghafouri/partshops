"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pause, Play, X } from "lucide-react";

export default function AdminSellerActions({ sellerId, status }: { sellerId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject" | "suspend" | "reactivate") {
    let reason: string | undefined;
    if (action === "reject") {
      const input = prompt("دلیل رد درخواست فروشنده را وارد کنید:");
      if (input === null) return;
      reason = input.trim() || undefined;
    }
    if (action === "suspend" && !confirm("دسترسی این فروشنده تعلیق شود؟")) return;

    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در انجام عملیات");
        return;
      }
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {status !== "APPROVED" && (
          <button
            onClick={() => run(status === "SUSPENDED" ? "reactivate" : "approve")}
            disabled={loading !== null}
            className="inline-flex items-center gap-1 rounded-lg bg-success/10 px-2.5 py-1.5 text-[10px] font-bold text-success hover:bg-success/20 disabled:opacity-50"
          >
            {loading === "approve" || loading === "reactivate" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {status === "SUSPENDED" ? "فعال‌سازی" : "تایید"}
          </button>
        )}
        {status !== "REJECTED" && (
          <button
            onClick={() => run("reject")}
            disabled={loading !== null}
            className="inline-flex items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-1.5 text-[10px] font-bold text-danger hover:bg-danger/20 disabled:opacity-50"
          >
            {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            رد
          </button>
        )}
        {status === "APPROVED" && (
          <button
            onClick={() => run("suspend")}
            disabled={loading !== null}
            className="inline-flex items-center gap-1 rounded-lg bg-warning/10 px-2.5 py-1.5 text-[10px] font-bold text-warning hover:bg-warning/20 disabled:opacity-50"
          >
            {loading === "suspend" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
            تعلیق
          </button>
        )}
        {status === "PENDING" && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-surface-hover px-2 py-1 text-[9px] text-muted">
            <Play className="w-3 h-3" />
            در انتظار بررسی
          </span>
        )}
      </div>
      {error && <p className="text-danger text-[10px] mt-1">{error}</p>}
    </div>
  );
}
