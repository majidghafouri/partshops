import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getAdminUserIds } from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";

const updateSchema = z.object({
  shopName: z.string().min(2, "نام فروشگاه الزامی است"),
  description: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "حداقل یک دسته‌بندی انتخاب کنید"),
});

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "SELLER" || !user.sellerProfileId) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const validCategories = await prisma.category.count({
      where: { id: { in: parsed.data.categoryIds } },
    });
    if (validCategories !== parsed.data.categoryIds.length) {
      return NextResponse.json({ error: "دسته‌بندی انتخاب شده معتبر نیست", field: "categoryIds" }, { status: 400 });
    }

    const current = await prisma.sellerProfile.findUnique({
      where: { id: user.sellerProfileId },
      select: { status: true, shopName: true },
    });
    const resubmit = current?.status === "REJECTED" || current?.status === "SUSPENDED";

    await prisma.$transaction(async (tx) => {
      await tx.sellerProfile.update({
        where: { id: user.sellerProfileId! },
        data: {
          shopName: parsed.data.shopName.trim(),
          description: parsed.data.description?.trim() || null,
          phone: parsed.data.phone?.trim() || null,
          city: parsed.data.city?.trim() || null,
          address: parsed.data.address?.trim() || null,
          status: resubmit ? "PENDING" : undefined,
          rejectionReason: resubmit ? null : undefined,
          approvedAt: resubmit ? null : undefined,
        },
      });

      await tx.sellerCategory.deleteMany({ where: { sellerId: user.sellerProfileId! } });
      await tx.sellerCategory.createMany({
        data: parsed.data.categoryIds.map((categoryId) => ({
          sellerId: user.sellerProfileId!,
          categoryId,
        })),
      });
    });

    if (resubmit) {
      const adminIds = await getAdminUserIds();
      await notifyUsers(
        adminIds.map((adminId) => ({
          userId: adminId,
          type: "SELLER_REGISTERED" as const,
          title: "درخواست بازبینی فروشنده",
          message: `فروشگاه «${parsed.data.shopName}» اطلاعات خود را ویرایش کرد و در انتظار تایید است.`,
        }))
      );
    }

    return NextResponse.json({
      message: resubmit
        ? "اطلاعات ذخیره شد و درخواست شما برای بررسی مجدد ارسال شد"
        : "اطلاعات فروشگاه ذخیره شد",
      resubmitted: resubmit,
    });
  } catch (error) {
    console.error("Update seller profile error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
