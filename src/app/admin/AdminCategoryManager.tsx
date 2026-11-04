"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/lib/types";

export default function AdminCategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", icon: "", parentId: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldError = (key: string) => fieldErrors[key];

  const parents = categories.filter((category) => !category.parentId);
  const childrenOf = (parentId: string) => categories.filter((category) => category.parentId === parentId);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (form.name.trim().length < 2) {
      setFieldErrors({ name: "نام دسته‌بندی را وارد کنید" });
      setError("لطفاً خطاهای مشخص‌شده را اصلاح کنید");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          icon: form.icon.trim() || undefined,
          parentId: form.parentId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        setError(data.error || "خطا در ایجاد دسته‌بندی");
        return;
      }
      setForm({ name: "", icon: "", parentId: form.parentId });
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این دسته‌بندی حذف شود؟")) return;
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در حذف دسته‌بندی");
        return;
      }
      router.refresh();
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {error && <div className="mb-3 rounded-xl bg-danger/10 border border-danger/30 px-3 py-2 text-[11px] text-danger">{error}</div>}
      <form onSubmit={handleAdd} noValidate className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="نام دسته‌بندی"
            className={`w-full h-10 px-3 rounded-lg bg-background border text-xs focus:outline-none focus:border-primary ${
              fieldError("name") ? "border-danger focus:border-danger" : "border-border"
            }`}
          />
          {fieldError("name") && <p className="mt-1 text-[11px] text-danger">{fieldError("name")}</p>}
        </div>
        <input
          value={form.icon}
          onChange={(event) => setForm({ ...form, icon: event.target.value })}
          placeholder="آیکون"
          className="h-10 px-3 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-primary"
        />
        <select
          value={form.parentId}
          onChange={(event) => setForm({ ...form, parentId: event.target.value })}
          className="h-10 px-3 rounded-lg bg-background border border-border text-xs focus:outline-none focus:border-primary"
        >
          <option value="">دسته اصلی</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              زیرمجموعه {parent.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="h-10 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          افزودن
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {parents.map((parent) => (
          <div key={parent.id} className="rounded-xl border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold">
                {parent.icon ? `${parent.icon} ` : ""}
                {parent.name}
              </span>
              <button onClick={() => handleDelete(parent.id)} disabled={deleting !== null} className="text-danger hover:text-danger/80 disabled:opacity-40 p-1">
                {deleting === parent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {childrenOf(parent.id).map((child) => (
                <div key={child.id} className="flex items-center justify-between gap-2 text-[11px] text-muted">
                  <span>{child.name}</span>
                  <button onClick={() => handleDelete(child.id)} disabled={deleting !== null} className="text-danger/70 hover:text-danger disabled:opacity-40 p-0.5">
                    {deleting === child.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
