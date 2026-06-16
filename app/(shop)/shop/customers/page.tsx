import { Users } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { PhoneLookupForm } from "@/src/presentation/components/stamp/PhoneLookupForm";
import { CustomerList } from "@/src/presentation/components/shop/CustomerList";
import { buildCustomerRows } from "@/src/presentation/components/shop/customer-rows";

export const dynamic = "force-dynamic";

export default async function ShopCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const { phone } = await searchParams;
  const search = phone?.trim() ?? "";

  const page = await container.customerRepository.pageByShop(shopId, {
    search: search || undefined,
  });
  const rows = await buildCustomerRows(shopId, page.items);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="ค้นหาลูกค้า" />
        <PhoneLookupForm
          action="/shop/customers"
          defaultPhone={phone ?? ""}
          placeholder="ค้นด้วยเบอร์โทร"
        />
      </Card>

      <Card>
        <CardHeader title="ลูกค้า" />
        {rows.length === 0 ? (
          <EmptyState icon={<Users />} title="ยังไม่มีลูกค้า" />
        ) : (
          <CustomerList
            initialItems={rows}
            initialCursor={page.nextCursor}
            search={search}
          />
        )}
      </Card>
    </div>
  );
}
