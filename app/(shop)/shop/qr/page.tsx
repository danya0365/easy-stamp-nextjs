import { requireShopAccess } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { renderQrDataUrl } from "@/src/infrastructure/services/qr";
import { getBaseUrl } from "@/src/presentation/lib/base-url";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { ShopQrPoster } from "@/src/presentation/components/shop/ShopQrPoster";

export const dynamic = "force-dynamic";

export default async function ShopQrPage() {
  const { shopId } = await requireShopAccess();
  const shop = await container.shopRepository.findById(shopId);
  if (!shop) return null;

  const url = `${await getBaseUrl()}/s/${shop.slug}`;
  const qrImageUrl = await renderQrDataUrl(url);

  return (
    <div>
      <Card>
        <CardHeader
          title="ป้าย QR ร้าน"
          subtitle="พิมพ์ติดหน้าเคาน์เตอร์ ให้ลูกค้าสแกนเพื่อสมัครและเช็คแต้ม"
        />
        <ShopQrPoster shopName={shop.name} url={url} qrImageUrl={qrImageUrl} />
      </Card>
    </div>
  );
}
