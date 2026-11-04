import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validationError } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getCategoriesFlat } from "@/lib/db";

function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "category"}-${Date.now().toString(36)}`;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }
  return NextResponse.json({ categories: await getCategoriesFlat() });
}

const createSchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی الزامی است"),
  icon: z.string().max(8).optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    if (parsed.data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parsed.data.parentId } });
      if (!parent) {
        return NextResponse.json({ error: "دسته‌بندی والد یافت نشد" }, { status: 400 });
      }
    }

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name.trim(),
        slug: slugify(parsed.data.name),
        icon: parsed.data.icon?.trim() || null,
        parentId: parsed.data.parentId ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });

    return NextResponse.json(
      {
        message: "دسته‌بندی ایجاد شد",
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          icon: category.icon,
          parentId: category.parentId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(2).optional(),
  icon: z.string().max(8).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(validationError(parsed.error), { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name?.trim(),
        icon: parsed.data.icon === undefined ? undefined : parsed.data.icon?.trim() || null,
        sortOrder: parsed.data.sortOrder,
      },
    });

    return NextResponse.json({ message: "دسته‌بندی به‌روزرسانی شد", category });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = z.object({ id: z.string() }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "شناسه دسته‌بندی الزامی است" }, { status: 400 });
    }

    const [requestItems, sellerCategories, children] = await Promise.all([
      prisma.requestItem.count({ where: { categoryId: parsed.data.id } }),
      prisma.sellerCategory.count({ where: { categoryId: parsed.data.id } }),
      prisma.category.count({ where: { parentId: parsed.data.id } }),
    ]);

    if (requestItems > 0 || sellerCategories > 0 || children > 0) {
      return NextResponse.json(
        { error: "این دسته‌بندی در درخواست‌ها یا فروشندگان استفاده شده و قابل حذف نیست" },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ message: "دسته‌بندی حذف شد" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "خطای داخلی سرور" }, { status: 500 });
  }
}
