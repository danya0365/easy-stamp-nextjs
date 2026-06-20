import { ShieldAlert } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AuditTimeline } from "@/src/presentation/components/admin/AuditTimeline";
import { PeerAdminList } from "@/src/presentation/components/admin/PeerAdminList";

export const dynamic = "force-dynamic";

/** Platform Trust & Safety hub — admin accounts + the security/support audit trail. */
export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const me = await requireRole("platform_admin");
  const { action } = await searchParams;
  const filter = action?.trim() ?? "";
  const [page, adminUsers] = await Promise.all([
    container.auditLogRepository.page(filter ? { action: filter } : {}),
    container.userRepository.listByRole("platform_admin"),
  ]);
  const admins = adminUsers.map((u) => ({
    id: u.id,
    email: u.email,
    totpEnabled: u.totpEnabled,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="ผู้ดูแลระบบ & 2FA"
          subtitle="สถานะ 2FA ของผู้ดูแลแต่ละคน · รีเซ็ต 2FA ให้เพื่อนได้เมื่อทำอุปกรณ์หาย (break-glass)"
        />
        <PeerAdminList admins={admins} currentAdminId={me.id} />
      </Card>

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
