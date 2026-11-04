import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { notifyUsers } from "@/lib/notifications";
import { getAdminUserIds } from "@/lib/db";

const registerSchema = z
  .object({
    name: z.string().min(2, "نام الزامی است"),
    email: z.string().email("ایمیل نامعتبر است").optional(),
    phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است").optional(),
    password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
    role: z.enum(["CUSTOMER", "SELLER"]).default("CUSTOMER"),
    city: z.string().optional(),
    shopName: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    sellerPhone: z.string().optional(),
    categoryIds: z.array(z.string()).default([]),
  })
  .refine((data) => data.email || data.phone, {
    message: "ایمیل یا شماره موبایل الزامی است",
    path: ["email"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { name, email, phone, password, role, city, shopName, description, address, sellerPhone, categoryIds } =
      parsed.data;

    if (role === "SELLER") {
      if (!shopName?.trim()) {
        return NextResponse.json(
          { error: "نام فروشگاه برای ثبت‌نام فروشنده الزامی است", field: "shopName" },
          { status: 400 }
        );
      }
      if (categoryIds.length === 0) {
        return NextResponse.json(
          { error: "حداقل یک دسته‌بندی قطعه را برای فروشگاه خود انتخاب کنید", field: "categoryIds" },
          { status: 400 }
        );
      }
      const validCategories = await prisma.category.count({
        where: { id: { in: categoryIds } },
      });
      if (validCategories !== categoryIds.length) {
        return NextResponse.json({ error: "دسته‌بندی انتخاب شده معتبر نیست", field: "categoryIds" }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role,
          city,
        },
      });

      if (role === "SELLER" && shopName) {
        const seller = await tx.sellerProfile.create({
          data: {
            userId: createdUser.id,
            shopName: shopName.trim(),
            description: description?.trim() || null,
            phone: sellerPhone?.trim() || phone || null,
            city: city || null,
            address: address?.trim() || null,
            status: "PENDING",
          },
        });

        await tx.sellerCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            sellerId: seller.id,
            categoryId,
          })),
        });
      }

      return createdUser;
    });

    if (role === "SELLER") {
      const adminIds = await getAdminUserIds();
      await notifyUsers(
        adminIds.map((adminId) => ({
          userId: adminId,
          type: "SELLER_REGISTERED" as const,
          title: "درخواست تایید فروشنده جدید",
          message: `فروشگاه «${shopName}» ثبت‌نام کرد و در انتظار تایید است.`,
        }))
      );
    }

    await createSession(user.id);

    return NextResponse.json(
      {
        message:
          role === "SELLER"
            ? "ثبت‌نام فروشنده انجام شد و پس از تایید مدیر فعال می‌شود"
            : "ثبت‌نام با موفقیت انجام شد",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          city: user.city,
          sellerStatus: role === "SELLER" ? "PENDING" : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "این ایمیل یا شماره موبایل قبلاً ثبت شده است" },
        { status: 409 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
