import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

const loginSchema = z
  .object({
    identifier: z.string().min(3, "ایمیل یا شماره موبایل الزامی است"),
    password: z.string().min(1, "رمز عبور الزامی است"),
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const identifier = parsed.data.identifier.trim().toLowerCase();
    const isEmail = identifier.includes("@");

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
      return NextResponse.json(
        { error: "ایمیل/شماره موبایل یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json({
      message: "ورود موفق",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
