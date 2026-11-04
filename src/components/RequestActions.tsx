"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle, PackageCheck } from "lucide-react";

export default function RequestActions({
  requestId,
  canCancel,
  canConfirmDelivery,
}: {
  requestId: string;
  canCancel?: boolean;
  canConfirmDelivery?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "cancel" | "deliver") {
    if (action === "cancel" && !confirm("این درخواست لغو شود؟")) return;
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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

  if (!canCancel && !canConfirmDelivery) return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {canConfirmDelivery && (
          <button
            onClick={() => run("deliver")}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2.5 bg-success/10 text-success hover:bg-success/20 disabled:opacity-60 rounded-xl text-xs font-bold transition-colors"
          >
            {loading === "deliver" ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
            تحویل گرفتم
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => run("cancel")}
            disabled={loading !== null}
            className="flex items-center gap-2 px-4 py-2.5 bg-danger/10 text-danger hover:bg-danger/20 disabled:opacity-60 rounded-xl text-xs font-bold transition-colors"
          >
            {loading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            لغو درخواست
          </button>
        )}
      </div>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}
