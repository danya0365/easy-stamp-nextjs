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

  const shop = await container.shopRepository.findById(shopId);
  const customers = (
    await container.customerRepository.listByShop(shopId, phone)
  ).slice(0, 50);

  const cards = await Promise.all(
    customers.map((c) =>
      container.stampCardRepository.findByCustomer(shopId, c.id),
    ),
  );
  const threshold = shop?.stampThreshold ?? 10;

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
          <EmptyState icon="🧑‍🤝‍🧑" title="ยังไม่มีลูกค้า" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {customers.map((c, i) => {
              const stamps = cards[i]?.currentStamps ?? 0;
              const eligible = stamps >= threshold;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="text-foreground">
                    {c.displayName || formatPhone(c.phone)}
                  </span>
                  {eligible ? (
                    <Badge tone="success">ครบ แลกได้</Badge>
                  ) : (
                    <Badge tone="brand">
                      {stamps}/{threshold}
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
