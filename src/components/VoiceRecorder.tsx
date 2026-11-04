"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square, Trash2 } from "lucide-react";
import { uploadMedia, type UploadedMedia } from "@/lib/upload";

const MAX_SECONDS = 60;

function faTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${new Intl.NumberFormat("fa-IR").format(minutes)}:${new Intl.NumberFormat("fa-IR", {
    minimumIntegerDigits: 2,
  }).format(rest)}`;
}

export default function VoiceRecorder({
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
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const secondsRef = useRef(0);
  const stoppingRef = useRef(false);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const next = Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAtRef.current) / 1000));
      secondsRef.current = next;
      setSeconds(next);
      if (next >= MAX_SECONDS) {
        stopRecording();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setLocalError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setLocalError("ضبط صدا در این مرورگر پشتیبانی نمی‌شود");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg"].find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      stoppingRef.current = false;
      startedAtRef.current = Date.now();
      secondsRef.current = 0;
      setSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);

        const rawType = recorder.mimeType || "audio/webm";
        const mimeType = rawType.split(";")[0] || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (blob.size === 0) {
          setLocalError("صدایی ضبط نشد؛ دوباره تلاش کنید");
          onBusyChange?.(false);
          return;
        }

        const extension = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `voice-${crypto.randomUUID()}.${extension}`, { type: mimeType });
        const durationSeconds = Math.max(1, Math.min(MAX_SECONDS, secondsRef.current));

        setUploading(true);
        try {
          const uploaded = await uploadMedia({ userId, file, kind: "AUDIO" });
          if (value) URL.revokeObjectURL(value.previewUrl);
          onChange({ ...uploaded, durationSeconds });
        } catch (uploadError) {
          setLocalError(
            uploadError instanceof Error && /[\u0600-\u06FF]/.test(uploadError.message)
              ? uploadError.message
              : "بارگذاری فایل صوتی انجام نشد؛ دوباره تلاش کنید"
          );
        } finally {
          setUploading(false);
          onBusyChange?.(false);
        }
      };

      recorder.start();
      onBusyChange?.(true);
      setRecording(true);
    } catch {
      onBusyChange?.(false);
      setLocalError("دسترسی به میکروفون داده نشد؛ مجوز مرورگر را بررسی کنید");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive" || stoppingRef.current) return;
    stoppingRef.current = true;
    recorder.stop();
  }

  function remove() {
    if (!value) return;
    URL.revokeObjectURL(value.previewUrl);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs text-muted-foreground">پیام صوتی</label>
        <span className="text-[10px] text-muted">حداکثر ۶۰ ثانیه</span>
      </div>

      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 p-3">
          <audio controls src={value.previewUrl} className="h-9 min-w-0 flex-1" />
          <button
            type="button"
            onClick={remove}
            className="rounded-lg p-2 text-danger hover:bg-danger/10"
            aria-label="حذف فایل صوتی"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : recording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full h-11 rounded-xl border border-danger/40 bg-danger/10 text-danger text-sm font-bold flex items-center justify-center gap-2"
        >
          <Square className="w-4 h-4 fill-current" />
          پایان ضبط ({faTime(seconds)})
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={uploading}
          className="w-full h-11 rounded-xl border border-border bg-background/60 text-sm text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          {uploading ? "در حال بارگذاری" : "ضبط پیام صوتی"}
        </button>
      )}

      {(localError || error) && <p className="text-[11px] text-danger">{localError ?? error}</p>}
    </div>
  );
}
