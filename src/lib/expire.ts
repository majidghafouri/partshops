import "server-only";
import { prisma } from "./prisma";
import { notifyUser, notifyUsers } from "./notifications";
import { publishToUser, publishToUsers } from "./realtime";

export async function expireStaleRequests(): Promise<number> {
  const now = new Date();
  const stale = await prisma.partRequest.findMany({
    where: { status: "OPEN", expiresAt: { lt: now } },
    select: {
      id: true,
      customerId: true,
      items: { select: { title: true } },
      offers: { select: { seller: { select: { userId: true } } } },
    },
    take: 100,
  });

  let expired = 0;
  for (const request of stale) {
    const result = await prisma.partRequest.updateMany({
      where: { id: request.id, status: "OPEN" },
      data: { status: "EXPIRED", closedAt: now },
    });
    if (result.count === 0) continue;
    expired += 1;

    const firstItem = request.items[0]?.title ?? "درخواست قطعه";
    await notifyUser({
      userId: request.customerId,
      type: "REQUEST_EXPIRED",
      title: "زمان درخواست شما به پایان رسید",
      message: `درخواست «${firstItem}» پس از ۳۰ دقیقه منقضی شد. می‌توانید همان درخواست را دوباره ثبت کنید.`,
      requestId: request.id,
    });

    publishToUser(request.customerId, {
      type: "request_expired",
      title: "درخواست منقضی شد",
      message: "زمان درخواست شما به پایان رسید. می‌توانید دوباره درخواست دهید.",
      requestId: request.id,
    });

    const sellerUserIds = request.offers.map((offer) => offer.seller.userId);
    if (sellerUserIds.length > 0) {
      await notifyUsers(
        sellerUserIds.map((userId) => ({
          userId,
          type: "REQUEST_CLOSED" as const,
          title: "درخواست منقضی شد",
          message: `زمان درخواست «${firstItem}» به پایان رسید و بسته شد.`,
          requestId: request.id,
        }))
      );
      publishToUsers(sellerUserIds, {
        type: "request_closed",
        title: "درخواست منقضی شد",
        message: "درخواست مورد نظر منقضی شد.",
        requestId: request.id,
      });
    }
  }

  return expired;
}

export async function expireRequestIfNeeded(requestId: string): Promise<void> {
  const now = new Date();
  const result = await prisma.partRequest.updateMany({
    where: { id: requestId, status: "OPEN", expiresAt: { lt: now } },
    data: { status: "EXPIRED", closedAt: now },
  });
  if (result.count === 0) return;

  const request = await prisma.partRequest.findUnique({
    where: { id: requestId },
    select: {
      customerId: true,
      items: { select: { title: true }, take: 1 },
      offers: { select: { seller: { select: { userId: true } } } },
    },
  });
  if (!request) return;

  const firstItem = request.items[0]?.title ?? "درخواست قطعه";
  await notifyUser({
    userId: request.customerId,
    type: "REQUEST_EXPIRED",
    title: "زمان درخواست شما به پایان رسید",
    message: `درخواست «${firstItem}» پس از ۳۰ دقیقه منقضی شد. می‌توانید همان درخواست را دوباره ثبت کنید.`,
    requestId,
  });
  publishToUser(request.customerId, {
    type: "request_expired",
    title: "درخواست منقضی شد",
    message: "زمان درخواست شما به پایان رسید. می‌توانید دوباره درخواست دهید.",
    requestId,
  });

  const sellerUserIds = request.offers.map((offer) => offer.seller.userId);
  if (sellerUserIds.length > 0) {
    publishToUsers(sellerUserIds, {
      type: "request_closed",
      title: "درخواست منقضی شد",
      message: "درخواست مورد نظر منقضی شد.",
      requestId,
    });
  }
}
