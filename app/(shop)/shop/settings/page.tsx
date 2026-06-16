import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { StampTypesManager } from "@/src/presentation/components/shop/StampTypesManager";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";
import { ContactAdminButton } from "@/src/presentation/components/shop/ContactAdminButton";
import { LineLinkCard } from "@/src/presentation/components/line/LineLinkCard";

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage() {
  const user = await requireRole("shop_owner");
  const shop = await container.shopRepository.findById(user.shopId!);
  if (!shop) return null;
  const stampTypes = await container.stampTypeRepository.listByShop(shop.id);

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader
          title="ประเภทแสตมป์"
          subtitle={`กำหนดได้หลายประเภท แต่ละประเภทมีจำนวนครบ + ของรางวัลของตัวเอง · ลิงก์ลูกค้า: /s/${shop.slug}`}
        />
        <StampTypesManager types={stampTypes} />
        <Link
          href="/shop/qr"
          className="mt-4 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
        >
          <ArrowRight className="size-4" />
          เปิดป้าย QR ร้าน (พิมพ์ติดหน้าร้าน)
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
