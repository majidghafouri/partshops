import type { AttachmentView } from "@/lib/types";

export default function AttachmentGallery({
  attachments,
  className,
}: {
  attachments: AttachmentView[];
  className?: string;
}) {
  if (attachments.length === 0) return null;
  const images = attachments.filter((item) => item.kind === "IMAGE");
  const audio = attachments.find((item) => item.kind === "AUDIO");
  const video = attachments.find((item) => item.kind === "VIDEO");

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <a
              key={image.id}
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-lg border border-border bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="تصویر قطعه"
                loading="lazy"
                className="h-24 w-full object-cover transition-transform hover:scale-105"
              />
            </a>
          ))}
        </div>
      )}

      {audio && (
        <div>
          <p className="mb-1.5 text-[11px] text-muted">پیام صوتی مشتری</p>
          <audio controls src={audio.url} className="h-9 w-full" />
        </div>
      )}

      {video && (
        <div>
          <p className="mb-1.5 text-[11px] text-muted">ویدیو مشتری</p>
          <video controls src={video.url} className="max-h-64 w-full rounded-lg bg-black" />
        </div>
      )}
    </div>
  );
}
