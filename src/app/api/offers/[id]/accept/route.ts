import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { notifyUser, notifyUsers } from "@/lib/notifications";
import { publishToUser, publishToUsers } from "@/lib/realtime";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "فقط مشتری می‌تواند پیشنهاد را بپذیرد" }, { status: 403 });
  }

  try {
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            userId: true,
            shopName: true,
            phone: true,
            address: true,
          },
        },
        request: {
          include: {
            items: { select: { title: true }, take: 1 },
            offers: {
              where: { status: "PENDING" },
              select: { id: true, seller: { select: { userId: true } } },
            },
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "پیشنهاد یافت نشد" }, { status: 404 });
    }
    if (offer.request.customerId !== user.id) {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }
    if (offer.status !== "PENDING") {
      return NextResponse.json({ error: "این پیشنهاد قابل پذیرش نیست" }, { status: 400 });
    }
    if (offer.request.status !== "OPEN") {
      return NextResponse.json({ error: "این درخواست دیگر فعال نیست" }, { status: 400 });
    }
    if (offer.request.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "زمان این درخواست تمام شده است. لطفاً درخواست جدید ثبت کنید" },
        { status: 400 }
      );
    }

    const otherSellerUserIds = offer.request.offers
      .filter((pendingOffer) => pendingOffer.id !== offer.id)
      .map((pendingOffer) => pendingOffer.seller.userId);

    const updated = await prisma.$transaction(async (tx) => {
      const accepted = await tx.partRequest.update({
        where: { id: offer.requestId },
        data: {
          status: "ACCEPTED",
          acceptedOfferId: offer.id,
          acceptedSellerId: offer.sellerId,
          closedAt: new Date(),
        },
      });

      await tx.offer.update({
        where: { id: offer.id },
        data: { status: "ACCEPTED" },
      });

      await tx.offer.updateMany({
        where: {
          requestId: offer.requestId,
          id: { not: offer.id },
          status: "PENDING",
        },
        data: { status: "REJECTED" },
      });

      return accepted;
    });

    const firstItem = offer.request.items[0]?.title ?? "درخواست قطعه";

    await notifyUser({
      userId: offer.seller.userId,
      type: "OFFER_ACCEPTED",
      title: "پیشنهاد شما پذیرفته شد",
      message: `مشتری پیشنهاد شما برای «${firstItem}» را پذیرفت. لطفاً قطعه را آماده و به آدرس مشتری ارسال کنید. آدرس: ${offer.request.address}`,
      requestId: offer.requestId,
    });

    publishToUser(offer.seller.userId, {
      type: "offer_accepted",
      title: "پیشنهاد شما پذیرفته شد",
      message: "مشتری پیشنهاد شما را پذیرفت. سفارش را آماده ارسال کنید.",
      requestId: offer.requestId,
      payload: { requestId: offer.requestId },
    });

    if (otherSellerUserIds.length > 0) {
      await notifyUsers(
        otherSellerUserIds.map((sellerUserId) => ({
          userId: sellerUserId,
          type: "REQUEST_CLOSED" as const,
          title: "درخواست بسته شد",
          message: `درخواست «${firstItem}» با پیشنهاد فروشنده دیگری نهایی شد.`,
          requestId: offer.requestId,
        }))
      );
      publishToUsers(otherSellerUserIds, {
        type: "request_closed",
        title: "درخواست بسته شد",
        message: `درخواست «${firstItem}» با فروشنده دیگری نهایی شد.`,
        requestId: offer.requestId,
      });
    }

    publishToUser(user.id, {
      type: "offer_accepted_customer",
      title: "پیشنهاد پذیرفته شد",
      message: `پیشنهاد فروشگاه «${offer.seller.shopName}» برای «${firstItem}» پذیرفته شد.`,
      requestId: offer.requestId,
    });

    return NextResponse.json({
      message: "پیشنهاد پذیرفته شد و به فروشنده اطلاع داده شد",
      request: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Accept offer error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
