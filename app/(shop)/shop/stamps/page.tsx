import { getTranslations } from "next-intl/server";

import { requireShopAccess } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { StampStation } from "@/src/presentation/components/stamp/StampStation";

export const dynamic = "force-dynamic";

export default async function ShopStampsPage() {
  const { shopId } = await requireShopAccess();
  const t = await getTranslations("shopPages");
  const [stampTypes, customers] = await Promise.all([
    container.stampTypeRepository.listByShop(shopId, { activeOnly: true }),
    container.customerRepository.listByShop(shopId),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">{t("stampsTitle")}</h1>
      <StampStation
        stampTypes={stampTypes}
        customers={customers.map((c) => ({
          id: c.id,
          phone: c.phone,
          name: c.displayName,
        }))}
      />
    </div>
  );
}
