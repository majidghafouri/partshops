import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getCustomerRequest, getRequestForAdmin, getSellerRequest } from "@/lib/db";
import { expireRequestIfNeeded } from "@/lib/expire";
import { notifyUser, notifyUsers } from "@/lib/notifications";
import { publishToUser, publishToUsers } from "@/lib/realtime";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  await expireRequestIfNeeded(id);

  if (user.role === "ADMIN") {
    const request = await getRequestForAdmin(id);
    return request
      ? NextResponse.json({ request })
      : NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
  }

  if (user.role === "CUSTOMER") {
    const request = await getCustomerRequest(id, user.id);
    return request
      ? NextResponse.json({ request })
      : NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
  }

  if (!user.sellerProfileId) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  const request = await getSellerRequest(id, user.sellerProfileId);
  return request
    ? NextResponse.json({ request })
    : NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
}

const actionSchema = z.object({
  action: z.enum(["cancel", "ship", "deliver"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
    }
    const { action } = parsed.data;

    const dbRequest = await prisma.partRequest.findUnique({
      where: { id },
      include: {
        items: { select: { title: true }, take: 1 },
        offers: { select: { seller: { select: { userId: true } } } },
        acceptedSeller: { select: { userId: true } },
      },
    });

    if (!dbRequest) {
      return NextResponse.json({ error: "درخواست یافت نشد" }, { status: 404 });
    }

    const firstItem = dbRequest.items[0]?.title ?? "درخواست قطعه";

    if (action === "cancel") {
      if (user.role !== "CUSTOMER" || dbRequest.customerId !== user.id) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
      if (dbRequest.status !== "OPEN") {
        return NextResponse.json(
          { error: "فقط درخواست‌های در انتظار پیشنهاد قابل لغو هستند" },
          { status: 400 }
        );
      }

      const updated = await prisma.partRequest.update({
        where: { id },
        data: { status: "CANCELLED", closedAt: new Date() },
      });

      const sellerUserIds = dbRequest.offers.map((offer) => offer.seller.userId);
      if (sellerUserIds.length > 0) {
        await notifyUsers(
          sellerUserIds.map((sellerUserId) => ({
            userId: sellerUserId,
            type: "REQUEST_CLOSED" as const,
            title: "درخواست توسط مشتری لغو شد",
            message: `درخواست «${firstItem}» لغو شد.`,
            requestId: id,
          }))
        );
        publishToUsers(sellerUserIds, {
          type: "request_closed",
          title: "درخواست لغو شد",
          message: `درخواست «${firstItem}» توسط مشتری لغو شد.`,
          requestId: id,
        });
      }

      publishToUser(user.id, {
        type: "request_cancelled",
        title: "درخواست لغو شد",
        message: "درخواست شما لغو شد.",
        requestId: id,
      });

      return NextResponse.json({ message: "درخواست لغو شد", status: updated.status });
    }

    if (action === "ship") {
      if (!user.sellerProfileId || dbRequest.acceptedSellerId !== user.sellerProfileId) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
      if (dbRequest.status !== "ACCEPTED") {
        return NextResponse.json({ error: "این درخواست در وضعیت قابل ارسال نیست" }, { status: 400 });
      }

      const updated = await prisma.partRequest.update({
        where: { id },
        data: { status: "SHIPPED" },
      });

      await notifyUser({
        userId: dbRequest.customerId,
        type: "REQUEST_SHIPPED",
        title: "سفارش شما ارسال شد",
        message: `فروشنده «${firstItem}» را ارسال کرد.`,
        requestId: id,
      });
      publishToUser(dbRequest.customerId, {
        type: "request_shipped",
        title: "سفارش ارسال شد",
        message: "فروشنده سفارش شما را ارسال کرد.",
        requestId: id,
      });

      return NextResponse.json({ message: "وضعیت به ارسال شده تغییر کرد", status: updated.status });
    }

    if (action === "deliver") {
      if (user.role !== "CUSTOMER" || dbRequest.customerId !== user.id) {
        return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
      }
      if (dbRequest.status !== "SHIPPED") {
        return NextResponse.json({ error: "این درخواست در وضعیت قابل تحویل نیست" }, { status: 400 });
      }

      const updated = await prisma.partRequest.update({
        where: { id },
        data: { status: "DELIVERED" },
      });

      if (dbRequest.acceptedSeller) {
        await notifyUser({
          userId: dbRequest.acceptedSeller.userId,
          type: "REQUEST_DELIVERED",
          title: "تحویل سفارش تایید شد",
          message: `مشتری تحویل «${firstItem}» را تایید کرد.`,
          requestId: id,
        });
        publishToUser(dbRequest.acceptedSeller.userId, {
          type: "request_delivered",
          title: "تحویل تایید شد",
          message: "مشتری تحویل سفارش را تایید کرد.",
          requestId: id,
        });
      }

      return NextResponse.json({ message: "تحویل سفارش تایید شد", status: updated.status });
    }

    return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
  } catch (error) {
    console.error("Update request error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
