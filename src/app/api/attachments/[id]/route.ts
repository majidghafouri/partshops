import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { expandCategoryIds } from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    select: {
      pathname: true,
      mimeType: true,
      request: {
        select: {
          customerId: true,
          status: true,
          acceptedSellerId: true,
          items: { select: { categoryId: true } },
        },
      },
    },
  });

  if (!attachment) {
    return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
  }

  const partRequest = attachment.request;
  let allowed = user.role === "ADMIN" || partRequest.customerId === user.id;

  if (!allowed && user.sellerProfileId) {
    const isAcceptedSeller = partRequest.acceptedSellerId === user.sellerProfileId;
    allowed = isAcceptedSeller;

    if (!allowed && partRequest.status === "OPEN") {
      const sellerCategoryIds = (
        await prisma.sellerCategory.findMany({
          where: { sellerId: user.sellerProfileId },
          select: { categoryId: true },
        })
      ).map((row) => row.categoryId);
      const categorySet = new Set(await expandCategoryIds(sellerCategoryIds));
      allowed = partRequest.items.some((item) => categorySet.has(item.categoryId));
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const range = request.headers.get("range");
    const result = await get(attachment.pathname, {
      access: "private",
      headers: range ? { range } : undefined,
    });

    if (!result || result.stream === null) {
      return NextResponse.json({ error: "فایل یافت نشد" }, { status: 404 });
    }

    const contentRange = result.headers.get("content-range");
    const headers = new Headers({
      "Content-Type": result.blob.contentType ?? attachment.mimeType,
      "Cache-Control": "private, max-age=300",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    });

    if (contentRange) {
      headers.set("Accept-Ranges", "bytes");
      headers.set("Content-Range", contentRange);
      headers.set("Content-Length", result.headers.get("content-length") ?? String(result.blob.size));
    } else {
      headers.set("Content-Length", String(result.blob.size));
    }

    return new NextResponse(result.stream, {
      status: contentRange ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Attachment fetch error:", error);
    return NextResponse.json({ error: "خطا در دریافت فایل" }, { status: 500 });
  }
}
