import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireRole("platform_admin");
  const [shops, pending] = await Promise.all([
    container.shopRepository.list(),
    container.paymentRepository.listByStatus("pending"),
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
      </div>

      <Card className="max-w-lg">
        <CardHeader title="เปลี่ยนรหัสผ่าน" />
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
