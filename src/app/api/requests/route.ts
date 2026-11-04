import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { head } from "@vercel/blob";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getCustomerRequests, getSellerUserIdsForCategories } from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";
import { publishToUsers } from "@/lib/realtime";
import { REQUEST_DURATION_MS } from "@/lib/status";
import {
  ATTACHMENT_LIMITS,
  MAX_AUDIO_FILES,
  MAX_VIDEO_FILES,
  MAX_VIDEO_SECONDS,
  type AttachmentKind,
} from "@/lib/attachments";

const attachmentInputSchema = z.object({
  pathname: z.string().min(1),
  kind: z.enum(["IMAGE", "AUDIO", "VIDEO"]),
  durationSeconds: z.number().int().min(0).max(120).optional(),
});

const itemSchema = z.object({
  categoryId: z.string().min(1, "دسته‌بندی هر قطعه الزامی است"),
  title: z.string().min(2, "نام قطعه الزامی است"),
  description: z.string().optional(),
  brand: z.string().optional(),
  partNumber: z.string().optional(),
  quantity: z.number().int().min(1).max(99).default(1),
  notes: z.string().optional(),
  attachments: z.array(attachmentInputSchema).max(3).default([]),
});

const createRequestSchema = z.object({
  items: z.array(itemSchema).min(1, "حداقل یک قطعه اضافه کنید").max(20),
  attachments: z.array(attachmentInputSchema).max(2).default([]),
  city: z.string().optional(),
  address: z.string().min(5, "آدرس تحویل الزامی است"),
  phone: z.string().regex(/^09\d{9}$/, "شماره تماس نامعتبر است").optional(),
  plateNumber: z.string().optional(),
  carMake: z.string().optional(),
  carModel: z.string().optional(),
  carYear: z.number().int().min(1300).max(new Date().getFullYear() + 1).optional(),
  notes: z.string().optional(),
});

type AttachmentInput = z.infer<typeof attachmentInputSchema>;

interface ResolvedAttachment {
  pathname: string;
  kind: AttachmentKind;
  url: string;
  mimeType: string;
  size: number;
  durationSeconds: number | null;
}

class AttachmentInputError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

async function resolveAttachments(
  inputs: AttachmentInput[],
  userId: string,
  allowedKinds: AttachmentKind[],
  field: string
): Promise<ResolvedAttachment[]> {
  return Promise.all(
    inputs.map(async (input) => {
      if (!allowedKinds.includes(input.kind)) {
        throw new AttachmentInputError(field, `نوع فایل «${ATTACHMENT_LIMITS[input.kind].label}» در این بخش مجاز نیست`);
      }

      if (!input.pathname.startsWith(`requests/${userId}/`)) {
        throw new AttachmentInputError(field, "مسیر فایل بارگذاری‌شده معتبر نیست");
      }

      const metadata = await head(input.pathname).catch(() => null);
      if (!metadata) {
        throw new AttachmentInputError(field, "فایل بارگذاری‌شده پیدا نشد؛ دوباره تلاش کنید");
      }

      const limit = ATTACHMENT_LIMITS[input.kind];
      if (!(limit.types as readonly string[]).includes(metadata.contentType)) {
        throw new AttachmentInputError(field, `فرمت ${limit.label} انتخاب‌شده مجاز نیست`);
      }
      if (metadata.size > limit.max) {
        throw new AttachmentInputError(field, `حجم ${limit.label} بیش از حد مجاز است`);
      }

      if (input.kind === "VIDEO") {
        if (!input.durationSeconds || input.durationSeconds > MAX_VIDEO_SECONDS) {
          throw new AttachmentInputError(field, `مدت ویدیو باید حداکثر ${MAX_VIDEO_SECONDS} ثانیه باشد`);
        }
      }

      return {
        ...input,
        url: metadata.url,
        mimeType: metadata.contentType,
        size: metadata.size,
        durationSeconds: input.durationSeconds ?? null,
      };
    })
  );
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const requests = await getCustomerRequests(user.id);
  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json(
      { error: "برای ثبت درخواست قطعه ابتدا با حساب مشتری وارد شوید" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const data = parsed.data;
    const categoryIds = [...new Set(data.items.map((item) => item.categoryId))];
    const validCategories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true },
    });
    if (validCategories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: "یکی از دسته‌بندی‌های انتخاب‌شده معتبر نیست", field: "items" },
        { status: 400 }
      );
    }

    const itemAttachments = await Promise.all(
      data.items.map((item, index) =>
        resolveAttachments(item.attachments, user.id, ["IMAGE"], `items.${index}.attachments`)
      )
    );

    const requestAttachments = await resolveAttachments(
      data.attachments,
      user.id,
      ["AUDIO", "VIDEO"],
      "attachments"
    );

    const audioCount = requestAttachments.filter((item) => item.kind === "AUDIO").length;
    const videoCount = requestAttachments.filter((item) => item.kind === "VIDEO").length;
    if (audioCount > MAX_AUDIO_FILES) {
      throw new AttachmentInputError("attachments", "فقط یک فایل صوتی برای هر درخواست مجاز است");
    }
    if (videoCount > MAX_VIDEO_FILES) {
      throw new AttachmentInputError("attachments", "فقط یک ویدیو برای هر درخواست مجاز است");
    }

    const expiresAt = new Date(Date.now() + REQUEST_DURATION_MS);
    const toCreate = (item: ResolvedAttachment) => ({
      kind: item.kind,
      pathname: item.pathname,
      url: item.url,
      mimeType: item.mimeType,
      size: item.size,
      durationSeconds: item.durationSeconds,
    });

    const created = await prisma.$transaction(async (tx) => {
      const partRequest = await tx.partRequest.create({
        data: {
          customerId: user.id,
          expiresAt,
          city: data.city?.trim() || null,
          address: data.address.trim(),
          phone: data.phone || user.phone || null,
          plateNumber: data.plateNumber?.trim() || null,
          carMake: data.carMake?.trim() || null,
          carModel: data.carModel?.trim() || null,
          carYear: data.carYear ?? null,
          notes: data.notes?.trim() || null,
          items: {
            create: data.items.map((item) => ({
              categoryId: item.categoryId,
              title: item.title.trim(),
              description: item.description?.trim() || null,
              brand: item.brand?.trim() || null,
              partNumber: item.partNumber?.trim() || null,
              quantity: item.quantity,
              notes: item.notes?.trim() || null,
            })),
          },
        },
        include: { items: { orderBy: { createdAt: "asc" } } },
      });

      const attachmentRows = [
        ...requestAttachments.map((item) => ({
          ...toCreate(item),
          requestId: partRequest.id,
        })),
        ...data.items.flatMap((_, index) =>
          itemAttachments[index].map((item) => ({
            ...toCreate(item),
            requestId: partRequest.id,
            itemId: partRequest.items[index].id,
          }))
        ),
      ];

      if (attachmentRows.length > 0) {
        await tx.attachment.createMany({ data: attachmentRows });
      }

      return partRequest;
    });

    const sellerUserIds = await getSellerUserIdsForCategories(categoryIds);
    const firstItem = created.items[0]?.title ?? "قطعه خودرو";
    const extra = created.items.length > 1 ? ` و ${created.items.length - 1} قطعه دیگر` : "";

    await notifyUsers(
      sellerUserIds.map((sellerUserId) => ({
        userId: sellerUserId,
        type: "NEW_REQUEST" as const,
        title: "درخواست جدید در دسته‌بندی شما",
        message: `درخواست «${firstItem}${extra}» ثبت شد. تا ۳۰ دقیقه فرصت ارسال پیشنهاد دارید.`,
        requestId: created.id,
      }))
    );

    publishToUsers(sellerUserIds, {
      type: "new_request",
      title: "درخواست جدید",
      message: `درخواست «${firstItem}${extra}» در دسته‌بندی شما ثبت شد.`,
      requestId: created.id,
    });

    return NextResponse.json(
      {
        message: "درخواست شما ثبت شد و برای فروشندگان مرتبط ارسال شد",
        request: {
          id: created.id,
          expiresAt: created.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AttachmentInputError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    console.error("Create request error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
