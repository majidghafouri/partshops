"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_EVENTS = [
  "connected",
  "new_request",
  "offer_received",
  "offer_accepted",
  "offer_accepted_customer",
  "request_closed",
  "request_expired",
  "request_cancelled",
  "request_shipped",
  "request_delivered",
  "seller_approved",
  "seller_rejected",
];

export default function LiveRefresh({
  types,
  intervalMs = 20000,
  showBadge = true,
}: {
  types?: string[];
  intervalMs?: number;
  showBadge?: boolean;
}) {
  const router = useRouter();
  const eventKey = (types ?? DEFAULT_EVENTS).join(",");

  useEffect(() => {
    const eventNames = eventKey.split(",");
    let closed = false;

    const handle = (event: Event) => {
      const message = event as MessageEvent;
      try {
        const data = message.data ? JSON.parse(message.data) : {};
        window.dispatchEvent(new CustomEvent("partshop:realtime", { detail: data }));
        if (data.type !== "connected") router.refresh();
      } catch {
        router.refresh();
      }
    };

    const source = new EventSource("/api/realtime/stream");
    source.onmessage = handle;
    for (const name of eventNames) {
      source.addEventListener(name, handle as EventListener);
    }

    const interval = setInterval(() => {
      if (!closed) router.refresh();
    }, intervalMs);

    return () => {
      closed = true;
      source.close();
      clearInterval(interval);
      for (const name of eventNames) {
        source.removeEventListener(name, handle as EventListener);
      }
    };
  }, [eventKey, intervalMs, router]);

  if (!showBadge) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-success">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>
      به‌روزرسانی زنده
    </span>
  );
}
