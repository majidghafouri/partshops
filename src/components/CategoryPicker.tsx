"use client";

import type { Category } from "@/lib/types";

export default function CategoryPicker({
  categories,
  value,
  onChange,
  disabled,
}: {
  categories: Category[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value);

  function toggle(id: string) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  if (categories.length === 0) {
    return <p className="text-xs text-muted">هنوز دسته‌بندی‌ای تعریف نشده است.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {categories.map((parent) => {
        const parentSelected = selected.has(parent.id);
        const childSelectedCount = (parent.children ?? []).filter((child) => selected.has(child.id)).length;
        return (
          <div
            key={parent.id}
            className={`rounded-2xl border p-4 transition-colors ${
              parentSelected || childSelectedCount > 0
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-background/50 hover:border-border-hover"
            }`}
          >
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={parentSelected}
                onChange={() => toggle(parent.id)}
                disabled={disabled}
                className="w-4 h-4 accent-primary"
              />
              <span className="flex items-center gap-2 text-sm font-bold">
                {parent.icon && <span className="text-lg">{parent.icon}</span>}
                {parent.name}
              </span>
              {parent.sellerCount !== undefined && (
                <span className="mr-auto text-[10px] text-muted">
                  {new Intl.NumberFormat("fa-IR").format(parent.sellerCount)} فروشنده
                </span>
              )}
            </label>
            {parent.children && parent.children.length > 0 && (
              <div className="mt-3 mr-7 grid grid-cols-1 gap-1.5 border-r border-border pr-3">
                {parent.children.map((child) => (
                  <label key={child.id} className="flex items-center gap-2.5 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-surface-hover transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(child.id)}
                      onChange={() => toggle(child.id)}
                      disabled={disabled}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground">{child.name}</span>
                    {child.sellerCount !== undefined && child.sellerCount > 0 && (
                      <span className="mr-auto text-[10px] text-muted">{child.sellerCount}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}