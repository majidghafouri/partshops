import { uploadPresigned } from "@vercel/blob/client";
import type { AttachmentKind } from "@/lib/attachments";

export interface UploadedMedia {
  pathname: string;
  kind: AttachmentKind;
  durationSeconds?: number;
  previewUrl: string;
}

function safeFileName(name: string) {
  const cleaned = name
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "file";
}

export async function uploadMedia({
  userId,
  file,
  kind,
  onProgress,
}: {
  userId: string;
  file: File;
  kind: AttachmentKind;
  onProgress?: (percentage: number) => void;
}): Promise<UploadedMedia> {
  const pathname = `requests/${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const result = await uploadPresigned(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/uploads",
    clientPayload: JSON.stringify({ kind }),
    contentType: file.type || undefined,
    multipart: kind === "VIDEO",
    onUploadProgress: (event) => onProgress?.(event.percentage),
  });

  return {
    pathname: result.pathname,
    kind,
    previewUrl: URL.createObjectURL(file),
  };
}
