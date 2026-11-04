"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/data";

export default function AcceptOfferButton({
  offerId,
  totalPrice,
}: {
  offerId: string;
  totalPrice: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!confirm(`پیشنهاد ${formatPrice(totalPrice)} پذیرفته شود؟ پس از پذیرش، درخواست بسته می‌شود.`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در پذیرش پیشنهاد");
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
        onClick={handleAccept}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-success hover:bg-success/90 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        پذیرش پیشنهاد
      </button>
      {error && <p className="text-danger text-[10px] mt-1">{error}</p>}
    </div>
  );
}
