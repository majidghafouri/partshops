"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { ATTACHMENT_LIMITS, MAX_ITEM_IMAGES } from "@/lib/attachments";
import { uploadMedia, type UploadedMedia } from "@/lib/upload";

export default function ImageUploader({
  userId,
  value,
  onChange,
  onBusyChange,
  error,
}: {
  userId: string;
  value: UploadedMedia[];
  onChange: (value: UploadedMedia[]) => void;
  onBusyChange?: (busy: boolean) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const remaining = MAX_ITEM_IMAGES - value.length;
  const limit = ATTACHMENT_LIMITS.IMAGE;

  async function handleFiles(files: FileList | null) {
    setLocalError(null);
    if (!files?.length) return;

    const selected = Array.from(files);
    if (selected.length > remaining) {
      setLocalError(`حداکثر ${MAX_ITEM_IMAGES} تصویر برای هر قطعه مجاز است`);
      return;
    }

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setLocalError("فقط فایل تصویری مجاز است");
        return;
      }
      if (file.size > limit.max) {
        setLocalError("حجم هر تصویر باید حداکثر ۶ مگابایت باشد");
        return;
      }
    }

    setUploading(true);
    onBusyChange?.(true);
    const uploaded: UploadedMedia[] = [];
    try {
      for (const file of selected) {
        uploaded.push(await uploadMedia({ userId, file, kind: "IMAGE" }));
      }
      onChange([...value, ...uploaded]);
    } catch (uploadError) {
      onChange([...value, ...uploaded]);
      setLocalError(
        uploadError instanceof Error && /[\u0600-\u06FF]/.test(uploadError.message)
          ? uploadError.message
          : "بارگذاری تصویر انجام نشد؛ دوباره تلاش کنید"
      );
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(item: UploadedMedia) {
    URL.revokeObjectURL(item.previewUrl);
    onChange(value.filter((current) => current.pathname !== item.pathname));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-muted-foreground">
          تصاویر قطعه ({new Intl.NumberFormat("fa-IR").format(value.length)} از {new Intl.NumberFormat("fa-IR").format(MAX_ITEM_IMAGES)})
        </label>
        <span className="text-[10px] text-muted">هر تصویر حداکثر ۶ مگابایت</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <div key={item.pathname} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(item)}
              className="absolute top-1 left-1 rounded-full bg-black/70 p-1 text-white hover:bg-danger"
              aria-label="حذف تصویر"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-xl border border-dashed border-border hover:border-primary text-muted hover:text-primary flex flex-col items-center justify-center gap-1 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            <span className="text-[10px]">{uploading ? "در حال بارگذاری" : "افزودن"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {(localError || error) && (
        <p className="text-[11px] text-danger">{localError ?? error}</p>
      )}
    </div>
  );
}
