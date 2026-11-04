import "server-only";
import { prisma } from "./prisma";
import { publishToUser, publishToUsers } from "./realtime";
import type { NotificationType } from "@/generated/prisma/enums";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  requestId?: string | null;
}

export async function notifyUser(input: NotifyInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      requestId: input.requestId ?? null,
    },
  });

  publishToUser(input.userId, {
    type: input.type,
    title: input.title,
    message: input.message,
    requestId: input.requestId ?? null,
    payload: { notificationId: notification.id },
  });

  return notification;
}

export async function notifyUsers(inputs: NotifyInput[]) {
  if (inputs.length === 0) return [];
  const created = await prisma.notification.createManyAndReturn({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      requestId: input.requestId ?? null,
    })),
  });

  for (const notification of created) {
    publishToUser(notification.userId, {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      requestId: notification.requestId,
      payload: { notificationId: notification.id },
    });
  }

  return created;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function getRecentNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function broadcastToUsers(userIds: string[], event: Parameters<typeof publishToUsers>[1]) {
  publishToUsers(userIds, event);
}
