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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {categories.map((parent) => (
        <div key={parent.id} className="bg-background border border-border rounded-xl p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.has(parent.id)}
              onChange={() => toggle(parent.id)}
              disabled={disabled}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium">
              {parent.icon ? `${parent.icon} ` : ""}
              {parent.name}
            </span>
          </label>
          {parent.children && parent.children.length > 0 && (
            <div className="mt-2 mr-6 space-y-1.5 border-r border-border pr-3">
              {parent.children.map((child) => (
                <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(child.id)}
                    onChange={() => toggle(child.id)}
                    disabled={disabled}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">{child.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
