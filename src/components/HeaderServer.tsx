import Header from "./Header";
import { getSessionUser } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function HeaderServer() {
  const user = await getSessionUser();
  const unreadCount = user ? await getUnreadNotificationCount(user.id) : 0;
  return <Header user={user} unreadCount={unreadCount} />;
}
