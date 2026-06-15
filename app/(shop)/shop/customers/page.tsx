import { Users } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { PhoneLookupForm } from "@/src/presentation/components/stamp/PhoneLookupForm";
import { formatPhone } from "@/src/domain/services/phone";

export const dynamic = "force-dynamic";

export default async function ShopCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { phone } = await searchParams;

  const [types, customers] = await Promise.all([
    container.stampTypeRepository.listByShop(shopId, { activeOnly: true }),
    container.customerRepository
      .listByShop(shopId, phone)
      .then((cs) => cs.slice(0, 50)),
  ]);

  // How many stamp types each customer has completed (eligible to redeem).
  const eligibleCounts = await Promise.all(
    customers.map(async (c) => {
      const card = await container.stampCardRepository.findByCustomer(
        shopId,
        c.id,
      );
      if (!card) return 0;
      const balances = await container.stampBalanceRepository.listByCard(
        card.id,
      );
      const byType = new Map(balances.map((b) => [b.stampTypeId, b.currentStamps]));
      return types.filter((t) => (byType.get(t.id) ?? 0) >= t.threshold).length;
    }),
  );

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader title="ค้นหาลูกค้า" />
        <PhoneLookupForm
          action="/shop/customers"
          defaultPhone={phone ?? ""}
          placeholder="ค้นด้วยเบอร์โทร"
        />
      </Card>

      <Card>
        <CardHeader title={`ลูกค้า (${customers.length})`} />
        {customers.length === 0 ? (
          <EmptyState icon={<Users />} title="ยังไม่มีลูกค้า" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {customers.map((c, i) => {
              const eligible = eligibleCounts[i];
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="text-foreground">
                    {c.displayName || formatPhone(c.phone)}
                  </span>
                  {eligible > 0 && (
                    <Badge tone="success">
                      ครบ แลกได้{eligible > 1 ? ` ${eligible} ประเภท` : ""}
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
