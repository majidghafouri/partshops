import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isApprovedSeller } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { publishToUser } from "@/lib/realtime";
import { expandCategoryIds } from "@/lib/categories";

const offerSchema = z.object({
  totalPrice: z.number().int().positive("قیمت پیشنهادی را وارد کنید"),
  deliveryFee: z.number().int().min(0).default(0),
  estimatedDeliveryHours: z.number().int().min(1).max(720).optional(),
  note: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!isApprovedSeller(user)) {
    return NextResponse.json(
      { error: "فقط فروشندگان تایید شده می‌توانند پیشنهاد ثبت کنند" },
      { status: 403 }
    );
  }
  const sellerId = user!.sellerProfileId!;

  try {
    const body = await request.json();
    const parsed = offerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const dbRequest = await prisma.partRequest.findUnique({
      where: { id },
      include: {
        items: { select: { title: true, categoryId: true } },
      },
    });

    if (!dbRequest) {
      return NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
    }
    if (dbRequest.status !== "OPEN") {
      return NextResponse.json({ error: "این درخواست دیگر فعال نیست" }, { status: 400 });
    }
    if (dbRequest.expiresAt <= new Date()) {
      return NextResponse.json({ error: "زمان ارسال پیشنهاد برای این درخواست تمام شده است" }, { status: 400 });
    }

    const sellerCategoryIds = (
      await prisma.sellerCategory.findMany({
        where: { sellerId },
        select: { categoryId: true },
      })
    ).map((row) => row.categoryId);
    const categorySet = new Set(await expandCategoryIds(sellerCategoryIds));
    const hasMatchingCategory = dbRequest.items.some((item) => categorySet.has(item.categoryId));
    if (!hasMatchingCategory) {
      return NextResponse.json(
        { error: "این درخواست در دسته‌بندی‌های فروشگاه شما نیست" },
        { status: 403 }
      );
    }

    const data = parsed.data;
    const existing = await prisma.offer.findUnique({
      where: { requestId_sellerId: { requestId: id, sellerId } },
    });

    const offer = await prisma.offer.upsert({
      where: { requestId_sellerId: { requestId: id, sellerId } },
      update: {
        totalPrice: data.totalPrice,
        deliveryFee: data.deliveryFee,
        estimatedDeliveryHours: data.estimatedDeliveryHours ?? null,
        note: data.note?.trim() || null,
        status: "PENDING",
      },
      create: {
        requestId: id,
        sellerId,
        totalPrice: data.totalPrice,
        deliveryFee: data.deliveryFee,
        estimatedDeliveryHours: data.estimatedDeliveryHours ?? null,
        note: data.note?.trim() || null,
      },
      include: {
        seller: { select: { shopName: true } },
      },
    });

    const firstItem = dbRequest.items[0]?.title ?? "درخواست قطعه";
    await notifyUser({
      userId: dbRequest.customerId,
      type: "OFFER_RECEIVED",
      title: existing ? "پیشنهاد شما به‌روزرسانی شد" : "پیشنهاد جدید دریافت کردید",
      message: `فروشگاه «${offer.seller.shopName}» برای «${firstItem}» پیشنهاد ${
        data.totalPrice.toLocaleString("fa-IR")
      } تومان ثبت کرد.`,
      requestId: id,
    });

    publishToUser(dbRequest.customerId, {
      type: "offer_received",
      title: existing ? "پیشنهاد به‌روزرسانی شد" : "پیشنهاد جدید",
      message: `یک فروشنده برای درخواست شما پیشنهاد ثبت کرد.`,
      requestId: id,
      payload: { offerId: offer.id },
    });

    return NextResponse.json(
      {
        message: existing ? "پیشنهاد شما به‌روزرسانی شد" : "پیشنهاد شما ثبت شد",
        offer: {
          id: offer.id,
          totalPrice: offer.totalPrice,
          deliveryFee: offer.deliveryFee,
        },
      },
      { status: existing ? 200 : 201 }
    );
  } catch (error) {
    console.error("Create offer error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
