import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getRecentNotifications, getUnreadNotificationCount } from "@/lib/notifications";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    getRecentNotifications(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      requestId: notification.requestId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    })),
  });
}

const patchSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
  }

  if (parsed.data.all) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
  } else if (parsed.data.id) {
    await prisma.notification.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: { isRead: true },
    });
  } else {
    return NextResponse.json({ error: "شناسه اعلان یا all لازم است" }, { status: 400 });
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  return NextResponse.json({ message: "اعلان‌ها به‌روزرسانی شد", unreadCount });
}
