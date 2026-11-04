"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";

export default function SellerJobActions({ requestId, canShip }: { requestId: string; canShip: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canShip) return null;

  async function handleShip() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در ثبت ارسال");
        return;
      }
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleShip}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-60 rounded-xl text-xs font-bold transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        ثبت ارسال سفارش
      </button>
      {error && <p className="text-danger text-[10px] mt-1">{error}</p>}
    </div>
  );
}
