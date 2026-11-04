import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getRecentNotifications } from "@/lib/notifications";
import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "اعلان‌ها | پارت شاپ",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/notifications");

  const notifications = await getRecentNotifications(user.id, 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">اعلان‌ها</h1>
        <p className="text-sm text-muted mt-1">همه رویدادهای حساب شما در یک جا.</p>
      </div>
      <NotificationsClient
        initial={notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          requestId: notification.requestId,
          isRead: notification.isRead,
          createdAt: notification.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
