import { requireShopAccess } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { renderQrDataUrl } from "@/src/infrastructure/services/qr";
import { getBaseUrl } from "@/src/presentation/lib/base-url";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { PromoStudio } from "@/src/presentation/components/shop/promote/PromoStudio";
import type { PromoSeedData } from "@/src/presentation/components/shop/promote/types";

export const dynamic = "force-dynamic";

export default async function ShopPromotePage() {
  const { shopId } = await requireShopAccess();
  const shop = await container.shopRepository.findById(shopId);
  if (!shop) return null;

  const publicUrl = `${await getBaseUrl()}/s/${shop.slug}`;
  const qrDataUrl = await renderQrDataUrl(publicUrl);

  // Reward tracks the owner can headline. id null = the shop's legacy default.
  const stampTypes = await container.stampTypeRepository.listByShop(shopId, {
    activeOnly: true,
  });
  const rewardOptions: PromoSeedData["rewardOptions"] =
    stampTypes.length > 0
      ? stampTypes.map((t) => ({
          id: t.id,
          label: t.name,
          rewardText: t.rewardText,
          threshold: t.threshold,
        }))
      : [
          {
            id: null,
            label: "ค่าเริ่มต้นของร้าน",
            rewardText: shop.rewardText,
            threshold: shop.stampThreshold,
          },
        ];

  // Inline the profile image as a data URL so html-to-image can draw it onto a
  // canvas at export time without tainting it (the public image route sets no
  // CORS header). The QR is already a data URL.
  const profile = await container.shopImageRepository.findProfile(shopId);
  let profileImageDataUrl: string | null = null;
  if (profile) {
    const file = await container.slipStorage.read(profile.storageKey);
    if (file) {
      const base64 = Buffer.from(file.bytes).toString("base64");
      profileImageDataUrl = `data:${file.contentType};base64,${base64}`;
    }
  }

  const seed: PromoSeedData = {
    shopName: shop.name,
    publicUrl,
    qrDataUrl,
    profileImageDataUrl,
    rewardOptions,
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="โปสเตอร์โปรโมท"
          subtitle="สร้างสื่อโปรโมทร้านพร้อมใช้ — เลือกเทมเพลต, สร้างพรอมต์ AI หรืออัปรูปมาวางป้ายสะสมแต้มทับ"
        />
        <PromoStudio seed={seed} />
      </Card>
    </div>
  );
}
