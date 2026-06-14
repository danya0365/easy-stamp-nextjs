import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { SettingsForm } from "@/src/presentation/components/shop/SettingsForm";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage() {
  const user = await requireRole("shop_owner");
  const shop = await container.shopRepository.findById(user.shopId!);
  if (!shop) return null;

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader
          title="ตั้งค่าร้าน"
          subtitle={`ลิงก์เช็คแต้มลูกค้า: /s/${shop.slug}`}
        />
        <SettingsForm
          stampThreshold={shop.stampThreshold}
          rewardText={shop.rewardText}
        />
        <Link
          href="/shop/qr"
          className="mt-4 inline-block text-sm text-brand-700 hover:underline"
        >
          → เปิดป้าย QR ร้าน (พิมพ์ติดหน้าร้าน)
        </Link>
      </Card>

      <Card className="mt-4">
        <CardHeader title="เปลี่ยนรหัสผ่าน" />
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
