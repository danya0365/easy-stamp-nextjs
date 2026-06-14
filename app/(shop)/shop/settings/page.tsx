import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { SettingsForm } from "@/src/presentation/components/shop/SettingsForm";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";
import { ContactAdminButton } from "@/src/presentation/components/shop/ContactAdminButton";
import { LineLinkCard } from "@/src/presentation/components/line/LineLinkCard";

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

      <Card className="mt-4">
        <CardHeader
          title="แจ้งเตือนผ่าน LINE"
          subtitle="เชื่อมต่อ LINE เพื่อรับแจ้งเตือนการอนุมัติ/ปฏิเสธการชำระเงิน"
        />
        <LineLinkCard
          linked={!!user.lineUserId}
          addUrl={process.env.NEXT_PUBLIC_LINE_OA_ADD_URL}
        />
      </Card>

      <Card className="mt-4">
        <CardHeader
          title="ติดต่อผู้ดูแลระบบ"
          subtitle="มีปัญหาการใช้งานหรือการชำระเงิน ส่งข้อความถึงผู้ดูแลได้ที่นี่"
        />
        <ContactAdminButton />
      </Card>
    </div>
  );
}
