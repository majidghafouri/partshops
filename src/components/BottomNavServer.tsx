import { getSessionUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";
import BottomNav from "./BottomNav";

export default async function BottomNavServer() {
  const user = await getSessionUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;
  return <BottomNav user={user} unreadCount={unreadCount} />;
}