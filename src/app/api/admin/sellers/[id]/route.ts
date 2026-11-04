import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import { publishToUser } from "@/lib/realtime";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "reactivate"]),
  reason: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "عملیات نامعتبر است" }, { status: 400 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!seller) {
      return NextResponse.json({ error: "فروشنده یافت نشد" }, { status: 404 });
    }

    const { action, reason } = parsed.data;
    const status =
      action === "approve"
        ? "APPROVED"
        : action === "reject"
          ? "REJECTED"
          : action === "suspend"
            ? "SUSPENDED"
            : "APPROVED";

    const updated = await prisma.sellerProfile.update({
      where: { id },
      data: {
        status,
        rejectionReason: action === "reject" ? reason?.trim() || "اطلاعات فروشگاه تایید نشد" : null,
        approvedAt: status === "APPROVED" ? new Date() : seller.approvedAt,
      },
    });

    const messages: Record<string, { title: string; message: string }> = {
      approve: {
        title: "فروشگاه شما تایید شد",
        message: "حساب فروشنده شما فعال شد و از این پس درخواست‌های مرتبط را دریافت می‌کنید.",
      },
      reject: {
        title: "فروشگاه شما تایید نشد",
        message: `درخواست فروشندگی شما تایید نشد. ${reason ? `دلیل: ${reason}` : ""}`,
      },
      suspend: {
        title: "فروشگاه شما تعلیق شد",
        message: "دسترسی فروشندگی شما موقتاً غیرفعال شد. برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.",
      },
      reactivate: {
        title: "فروشگاه شما فعال شد",
        message: "دسترسی فروشندگی شما دوباره فعال شد.",
      },
    };

    const notification = messages[action];
    await notifyUser({
      userId: seller.userId,
      type: action === "approve" || action === "reactivate" ? "SELLER_APPROVED" : "SELLER_REJECTED",
      title: notification.title,
      message: notification.message,
    });
    publishToUser(seller.userId, {
      type: action === "approve" || action === "reactivate" ? "seller_approved" : "seller_rejected",
      title: notification.title,
      message: notification.message,
    });

    return NextResponse.json({
      message: notification.title,
      seller: { id: updated.id, status: updated.status },
    });
  } catch (error) {
    console.error("Admin seller action error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
