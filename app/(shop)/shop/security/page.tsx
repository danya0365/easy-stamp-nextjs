import { ShieldAlert } from "lucide-react";

import { requireShopAccess } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AuditTimeline } from "@/src/presentation/components/admin/AuditTimeline";

export const dynamic = "force-dynamic";

/** Owner-facing activity/security log — scoped to this shop only. */
export default async function ShopSecurityPage() {
  const { shopId } = await requireShopAccess();
  const page = await container.auditLogRepository.pageByShop(shopId);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="ความปลอดภัย & กิจกรรมของร้าน"
          subtitle="เหตุการณ์สำคัญของร้านคุณ — เข้าสู่ระบบ, จัดการพนักงาน, การเพิ่มแสตมป์ที่ผิดปกติ"
        />
        {page.items.length === 0 ? (
          <EmptyState icon={<ShieldAlert />} title="ยังไม่มีเหตุการณ์" />
        ) : (
          <AuditTimeline
            scope="shop"
            initialItems={page.items}
            initialCursor={page.nextCursor}
          />
        )}
      </Card>
    </div>
  );
}
