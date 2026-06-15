import { Clock } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { ContactAdminForm } from "@/src/presentation/components/shop/ContactAdminForm";
import { formatDateTime } from "@/src/presentation/lib/format-date";

export const dynamic = "force-dynamic";

export default async function ShopContactPage() {
  const user = await requireRole("shop_owner");
  const requests = await container.contactRequestRepository.listByShop(
    user.shopId!,
    10,
  );
  const open = requests.find((r) => r.status === "open");
  const past = requests.filter((r) => r.status === "resolved");

  return (
    <div className="flex max-w-lg flex-col gap-4">
      {open ? (
        <Card>
          <CardHeader
            title="คำขอของคุณกำลังรอผู้ดูแลตอบกลับ"
            action={
              <Badge tone="warning">
                <Clock className="size-3.5" />
                รอดำเนินการ
              </Badge>
            }
          />
          <p className="font-medium text-foreground">{open.subject}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
            {open.message}
          </p>
          <p className="mt-2 text-xs text-muted">
            ส่งเมื่อ {formatDateTime(open.createdAt)}
          </p>
          <p className="mt-3 rounded-lg bg-muted-surface px-3 py-2 text-xs text-muted">
            ส่งคำขอใหม่ได้เมื่อผู้ดูแลปิดเรื่องนี้แล้ว
            จะมีการแจ้งเตือนกลับมาเมื่อผู้ดูแลรับเรื่อง
          </p>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title="ติดต่อผู้ดูแลระบบ"
            subtitle="มีปัญหาการใช้งานหรือการชำระเงิน ส่งข้อความถึงผู้ดูแล แล้วทิ้งช่องทางให้ติดต่อกลับ"
          />
          <ContactAdminForm />
        </Card>
      )}

      {past.length > 0 && (
        <Card>
          <CardHeader title="ประวัติคำขอ" />
          <ul className="flex flex-col divide-y divide-border">
            {past.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {r.subject}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <Badge tone="success">ดำเนินการแล้ว</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
