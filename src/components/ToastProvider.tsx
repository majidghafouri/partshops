"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ toast: (message: string, type?: ToastType) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  function remove(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  const iconFor = (type: ToastType) => {
    if (type === "success") return <CheckCircle2 className="w-4 h-4" />;
    if (type === "error") return <AlertTriangle className="w-4 h-4" />;
    return <Info className="w-4 h-4" />;
  };

  const colorFor = (type: ToastType) => {
    if (type === "success") return "bg-success/10 border-success/30 text-success";
    if (type === "error") return "bg-danger/10 border-danger/30 text-danger";
    return "bg-surface border-border text-foreground";
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg animate-fade-in ${colorFor(t.type)}`}
          >
            {iconFor(t.type)}
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}