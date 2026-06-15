import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { NotificationList } from "@/src/presentation/components/notification/NotificationList";
import { NotificationInbox } from "@/src/presentation/components/notification/NotificationInbox";
import { MarkAllReadOnView } from "@/src/presentation/components/notification/MarkAllReadOnView";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const user = await requireRole("platform_admin");
  const page = await container.notificationRepository.pageByUser(user.id);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <MarkAllReadOnView />
      <Card>
        <CardHeader title="การแจ้งเตือน" />
        {page.items.length === 0 ? (
          <NotificationList items={[]} />
        ) : (
          <NotificationInbox
            initialItems={page.items}
            initialCursor={page.nextCursor}
          />
        )}
      </Card>
    </div>
  );
}
