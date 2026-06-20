import { ShieldAlert } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AuditTimeline } from "@/src/presentation/components/admin/AuditTimeline";

export const dynamic = "force-dynamic";

/** Platform Trust & Safety hub — the security/support audit trail. */
export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireRole("platform_admin");
  const { action } = await searchParams;
  const filter = action?.trim() ?? "";
  const page = await container.auditLogRepository.page(
    filter ? { action: filter } : {},
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="ความปลอดภัย & การตรวจสอบ"
          subtitle="บันทึกเหตุการณ์สำคัญทั้งระบบ — เข้าสู่ระบบ, รีเซ็ตรหัส, ระงับร้าน, ตรวจสลิป ฯลฯ"
        />
        {page.items.length === 0 ? (
          <EmptyState icon={<ShieldAlert />} title="ยังไม่มีเหตุการณ์" />
        ) : (
          <AuditTimeline
            initialItems={page.items}
            initialCursor={page.nextCursor}
            action={filter}
          />
        )}
      </Card>
    </div>
  );
}
