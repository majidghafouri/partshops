import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2, "نام الزامی است").optional(),
  city: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name?.trim() || undefined,
        city: parsed.data.city?.trim() || undefined,
      },
    });

    return NextResponse.json({ message: "اطلاعات حساب به‌روزرسانی شد" });
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}