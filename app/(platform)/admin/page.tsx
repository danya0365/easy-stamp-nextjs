import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";
import { LineLinkCard } from "@/src/presentation/components/line/LineLinkCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireRole("platform_admin");
  const [shops, pending, openContacts] = await Promise.all([
    container.shopRepository.list(),
    container.paymentRepository.listByStatus("pending"),
    container.contactRequestRepository.countByStatus("open"),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-foreground">ภาพรวมระบบ</h1>
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/shops">
          <Card className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-brand-600">
              {shops.length}
            </span>
            <span className="text-sm text-muted">ร้านค้าทั้งหมด</span>
          </Card>
        </Link>
        <Link href="/admin/payments">
          <Card className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-accent-500">
              {pending.length}
            </span>
            <span className="text-sm text-muted">รอตรวจสอบการชำระเงิน</span>
          </Card>
        </Link>
        <Link href="/admin/contacts">
          <Card className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-accent-500">
              {openContacts}
            </span>
            <span className="text-sm text-muted">คำขอติดต่อรอดำเนินการ</span>
          </Card>
        </Link>
      </div>

      <Card className="max-w-lg">
        <CardHeader
          title="แจ้งเตือนผ่าน LINE"
          subtitle="เชื่อมต่อ LINE เพื่อรับแจ้งเตือนเมื่อมีการแจ้งชำระเงิน/คำขอติดต่อ"
        />
        <LineLinkCard
          linked={!!user.lineUserId}
          addUrl={process.env.NEXT_PUBLIC_LINE_OA_ADD_URL}
        />
      </Card>

      <Card className="max-w-lg">
        <CardHeader title="เปลี่ยนรหัสผ่าน" />
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
