import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSessionUser, verifyPassword, hashPassword } from "@/lib/auth";

const schema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است"),
  newPassword: z.string().min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد"),
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const ok = await verifyPassword(parsed.data.currentPassword, dbUser.password);
    if (!ok) {
      return NextResponse.json(
        { error: "رمز عبور فعلی اشتباه است", field: "currentPassword" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "رمز عبور با موفقیت تغییر کرد" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}