import { getTranslations } from "next-intl/server";

import { requireShopAccess } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { RedemptionHistory } from "@/src/presentation/components/stamp/RedemptionHistory";
import { RedemptionList } from "@/src/presentation/components/stamp/RedemptionList";
import { BuildRedemptionItemsUseCase } from "@/src/application/use-cases/stamp/BuildRedemptionItemsUseCase";

export const dynamic = "force-dynamic";

export default async function ShopRedemptionsPage() {
  const { shopId } = await requireShopAccess();
  const t = await getTranslations("shopPages");

  const page = await container.rewardRedemptionRepository.pageByShop(shopId);
  const items = await new BuildRedemptionItemsUseCase(
    container.customerRepository,
    container.branchRepository,
  ).forShop(shopId, page.items);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={t("redemptionHistoryTitle")} subtitle={t("latestFirst")} />
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
