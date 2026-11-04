"use client";

import { useRef, useState } from "react";
import { Loader2, Trash2, Video } from "lucide-react";
import { ATTACHMENT_LIMITS, MAX_VIDEO_SECONDS } from "@/lib/attachments";
import { uploadMedia, type UploadedMedia } from "@/lib/upload";

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("خواندن مدت ویدیو ممکن نشد"));
    }, 10000);

    video.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error("خواندن مدت ویدیو ممکن نشد"));
        return;
      }
      resolve(duration);
    };
    video.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error("فایل ویدیو معتبر نیست"));
    };
    video.src = url;
  });
}

export default function VideoUploader({
  userId,
  value,
  onChange,
  onBusyChange,
  error,
}: {
  userId: string;
  value: UploadedMedia | null;
  onChange: (value: UploadedMedia | null) => void;
  onBusyChange?: (busy: boolean) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const limit = ATTACHMENT_LIMITS.VIDEO;

  async function handleFile(file: File | null) {
    setLocalError(null);
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setLocalError("فقط فایل ویدیویی مجاز است");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > limit.max) {
      setLocalError("حجم ویدیو باید حداکثر ۵۰ مگابایت باشد");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    let duration: number;
    try {
      duration = await readDuration(file);
    } catch (durationError) {
      setLocalError(durationError instanceof Error ? durationError.message : "فایل ویدیو معتبر نیست");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (duration > MAX_VIDEO_SECONDS + 0.5) {
      setLocalError(`مدت ویدیو باید حداکثر ${new Intl.NumberFormat("fa-IR").format(MAX_VIDEO_SECONDS)} ثانیه باشد`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    onBusyChange?.(true);
    setProgress(0);
    try {
      const uploaded = await uploadMedia({
        userId,
        file,
        kind: "VIDEO",
        onProgress: setProgress,
      });
      if (value) URL.revokeObjectURL(value.previewUrl);
      onChange({ ...uploaded, durationSeconds: Math.max(1, Math.ceil(duration)) });
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error && /[\u0600-\u06FF]/.test(uploadError.message)
          ? uploadError.message
          : "بارگذاری ویدیو انجام نشد؛ دوباره تلاش کنید"
      );
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    if (!value) return;
    URL.revokeObjectURL(value.previewUrl);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-muted-foreground">ویدیو کوتاه</label>
        <span className="text-[10px] text-muted">حداکثر ۲۰ ثانیه و ۵۰ مگابایت</span>
      </div>

      {value ? (
        <div className="rounded-xl border border-border bg-background/60 p-3 space-y-2">
          <video controls src={value.previewUrl} className="w-full max-h-64 rounded-lg bg-black" />
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-danger hover:bg-danger/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف ویدیو
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-11 rounded-xl border border-dashed border-border bg-background/60 text-sm text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
          {uploading
            ? `در حال بارگذاری ${new Intl.NumberFormat("fa-IR").format(Math.round(progress))}٪`
            : "افزودن ویدیو"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      {(localError || error) && <p className="text-[11px] text-danger">{localError ?? error}</p>}
    </div>
  );
}
