import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { generateOtpCode } from "@/lib/auth";
import { isSmsConfigured, sendOtpSms } from "@/lib/sms";

const requestSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل نامعتبر است"),
});

const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const { phone } = parsed.data;

    const recent = await prisma.otpCode.findFirst({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      return NextResponse.json(
        { error: "برای درخواست کد جدید کمی صبر کنید", field: "phone" },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json(
        { error: "کاربری با این شماره یافت نشد. ابتدا ثبت‌نام کنید.", field: "phone" },
        { status: 404 }
      );
    }

    const smsConfigured = isSmsConfigured();
    if (!smsConfigured && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "سرویس پیامک هنوز پیکربندی نشده است", field: "phone" },
        { status: 503 }
      );
    }

    const code = generateOtpCode();
    const otp = await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      },
    });

    if (smsConfigured) {
      try {
        await sendOtpSms(phone, code);
      } catch {
        await prisma.otpCode.delete({ where: { id: otp.id } });
        return NextResponse.json(
          { error: "ارسال پیامک انجام نشد؛ دوباره تلاش کنید", field: "phone" },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      message: "کد یکبار مصرف ارسال شد",
      devCode: process.env.NODE_ENV === "production" ? undefined : code,
    });
  } catch (error) {
    console.error("OTP request error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
