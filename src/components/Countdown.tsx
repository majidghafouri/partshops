"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatCountdown, remainingSeconds } from "@/lib/status";

export default function Countdown({
  expiresAt,
  active = true,
  className,
}: {
  expiresAt: string;
  active?: boolean;
  className?: string;
}) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(expiresAt));

  useEffect(() => {
    if (!active) return;
    const tick = () => setSeconds(remainingSeconds(expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, active]);

  if (!active) {
    return <span className={className}>—</span>;
  }

  const expired = seconds <= 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-xs font-bold tabular-nums ${
        expired ? "text-danger" : seconds <= 300 ? "text-warning" : "text-success"
      } ${className ?? ""}`}
    >
      <Clock className="w-3.5 h-3.5" />
      {expired ? "زمان تمام شد" : formatCountdown(seconds)}
    </span>
  );
}
