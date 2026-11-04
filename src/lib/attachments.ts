export const ATTACHMENT_LIMITS = {
  IMAGE: {
    max: 6 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif"],
    label: "تصویر",
  },
  AUDIO: {
    max: 12 * 1024 * 1024,
    types: ["audio/webm", "audio/mp4", "audio/mpeg", "audio/ogg", "audio/wav", "audio/x-m4a", "audio/aac", "audio/x-wav"],
    label: "فایل صوتی",
  },
  VIDEO: {
    max: 50 * 1024 * 1024,
    types: ["video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/x-m4v"],
    label: "ویدیو",
  },
} as const;

export type AttachmentKind = keyof typeof ATTACHMENT_LIMITS;

export const MAX_ITEM_IMAGES = 3;
export const MAX_AUDIO_FILES = 1;
export const MAX_VIDEO_FILES = 1;
export const MAX_VIDEO_SECONDS = 20;

export function isAttachmentKind(value: unknown): value is AttachmentKind {
  return value === "IMAGE" || value === "AUDIO" || value === "VIDEO";
}
