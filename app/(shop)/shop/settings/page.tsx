import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { StampTypesManager } from "@/src/presentation/components/shop/StampTypesManager";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";
import { ContactAdminButton } from "@/src/presentation/components/shop/ContactAdminButton";
import { ConnectionsSection } from "@/src/presentation/components/channels/ConnectionsSection";
import { PauseShopControl } from "@/src/presentation/components/shop/PauseShopControl";
import { ShopImagesManager } from "@/src/presentation/components/shop/ShopImagesManager";
import { SettingsTabs } from "@/src/presentation/components/settings/SettingsTabs";

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage() {
  const user = await requireRole("shop_owner");
  const shop = await container.shopRepository.findById(user.shopId!);
  if (!shop) return null;
  const [stampTypes, subscription, shopImages] = await Promise.all([
    container.stampTypeRepository.listByShop(shop.id),
    container.subscriptionRepository.findByShop(shop.id),
    container.shopImageRepository.listByShop(shop.id),
  ]);

  return (
    <SettingsTabs
      tabs={[
        {
          id: "shop",
          label: "แสตมป์ & ร้านค้า",
          icon: "stamp",
          content: (
            <>
              <Card>
                <CardHeader
                  title="ประเภทแสตมป์"
                  subtitle={
                    <>
                      กำหนดได้หลายประเภท แต่ละประเภทมีจำนวนครบ + ของรางวัลของตัวเอง ·{" "}
                      <a
                        href={`/s/${shop.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-brand-700 hover:underline"
                      >
                        เปิดหน้าร้าน /s/{shop.slug} ↗
                      </a>
                    </>
                  }
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

              <Card>
                <CardHeader
                  title="ปิดร้านชั่วคราว"
                  subtitle="หยุดให้บริการชั่วคราวโดยไม่เสียวันใช้งานที่เหลือ"
                />
                <PauseShopControl paused={!!subscription?.pausedAt} />
              </Card>
            </>
          ),
        },
        {
          id: "images",
          label: "ภาพร้าน",
          icon: "image",
          content: (
            <Card>
              <CardHeader
                title="รูปโปรไฟล์ & แกลเลอรี่"
                subtitle={`รูปจะแสดงบนหน้าร้านสาธารณะ /s/${shop.slug}`}
              />
              <ShopImagesManager images={shopImages} />
            </Card>
          ),
        },
        {
          id: "security",
          label: "บัญชี & ความปลอดภัย",
          icon: "shield",
          content: (
            <>
              <Card>
                <CardHeader title="เปลี่ยนรหัสผ่าน" />
                <ChangePasswordForm />
              </Card>

              <Card>
                <CardHeader
                  title="ช่องทางเชื่อมต่อ & ความปลอดภัย"
                  subtitle="เชื่อมช่องทางเพื่อรับการแจ้งเตือนผลอนุมัติการชำระเงิน และเข้าสู่ระบบด้วยรหัส OTP"
                />
                <ConnectionsSection
                  linked={!!user.lineUserId}
                  addUrl={process.env.NEXT_PUBLIC_LINE_OA_ADD_URL}
                />
              </Card>
            </>
          ),
        },
      ]}
      footer={
        <Card>
          <CardHeader
            title="ติดต่อผู้ดูแลระบบ"
            subtitle="มีปัญหาการใช้งานหรือการชำระเงิน ส่งข้อความถึงผู้ดูแลได้ที่นี่"
          />
          <ContactAdminButton />
        </Card>
      }
    />
  );
}
