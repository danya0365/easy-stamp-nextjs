import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { RedemptionHistory } from "@/src/presentation/components/stamp/RedemptionHistory";
import { RedemptionList } from "@/src/presentation/components/stamp/RedemptionList";
import { buildShopRedemptionItems } from "@/src/presentation/components/stamp/redemption-items";

export const dynamic = "force-dynamic";

export default async function ShopRedemptionsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const page = await container.rewardRedemptionRepository.pageByShop(shopId);
  const items = await buildShopRedemptionItems(shopId, page.items);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="ประวัติการแลกรางวัล" subtitle="รายการล่าสุดก่อน" />
        {items.length === 0 ? (
          <RedemptionHistory items={[]} showCustomer />
        ) : (
          <RedemptionList
            initialItems={items}
            initialCursor={page.nextCursor}
            mode="shop"
          />
        )}
      </Card>
    </div>
  );
}
