import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

const registerSchema = z
  .object({
    name: z.string().min(2, "نام الزامی است"),
    email: z.string().email("ایمیل نامعتبر است").optional(),
    phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است").optional(),
    password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
    role: z.enum(["CUSTOMER", "SELLER"]).default("CUSTOMER"),
    city: z.string().optional(),
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

    const { name, email, phone, password, role, city } = parsed.data;

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        city,
      },
    });

    await createSession(user.id);

    return NextResponse.json(
      {
        message:
          role === "SELLER"
            ? "ثبت‌نام با موفقیت انجام شد. اکنون اطلاعات فروشگاه خود را تکمیل کنید."
            : "ثبت‌نام با موفقیت انجام شد",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          city: user.city,
          sellerStatus: null,
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