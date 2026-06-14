import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import {
  RedemptionHistory,
  type RedemptionItem,
} from "@/src/presentation/components/stamp/RedemptionHistory";
import { formatPhone } from "@/src/domain/services/phone";

export const dynamic = "force-dynamic";

export default async function ShopRedemptionsPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;

  const [redemptions, customers, branches] = await Promise.all([
    container.rewardRedemptionRepository.listByShop(shopId, 100),
    container.customerRepository.listByShop(shopId),
    container.branchRepository.listByShop(shopId),
  ]);

  const customerName = new Map(
    customers.map((c) => [c.id, c.displayName || formatPhone(c.phone)]),
  );
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  const items: RedemptionItem[] = redemptions.map((r) => ({
    ...r,
    customerLabel: customerName.get(r.customerId) ?? "ลูกค้า",
    branchLabel: r.branchId ? (branchName.get(r.branchId) ?? null) : null,
  }));

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader
          title={`ประวัติการแลกรางวัล (${items.length})`}
          subtitle="รายการล่าสุด สูงสุด 100 รายการ"
        />
        <RedemptionHistory items={items} showCustomer />
      </Card>
    </div>
  );
}
