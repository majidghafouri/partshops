import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const verifySchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
  code: z.string().regex(/^\d{6}$/, "کد باید ۶ رقم باشد"),
});

const MAX_ATTEMPTS_PER_WINDOW = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { phone, code } = parsed.data;

    const recentCodes = await prisma.otpCode.findMany({
      where: { phone, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    });

    if (recentCodes.length >= MAX_ATTEMPTS_PER_WINDOW) {
      return NextResponse.json(
        { error: "تعداد تلاش‌ها زیاد بوده است. بعداً دوباره تلاش کنید." },
        { status: 429 }
      );
    }

    const otp = recentCodes.find((o) => !o.used && o.code === code);

    if (!otp) {
      return NextResponse.json(
        { error: "کد وارد شده اشتباه است" },
        { status: 401 }
      );
    }

    if (otp.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "کد منقضی شده است. کد جدید درخواست کنید." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    await createSession(user.id);

    return NextResponse.json({
      message: "ورود موفق",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
