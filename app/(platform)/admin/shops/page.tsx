import Link from "next/link";
import { Store } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { GetBillingStateUseCase } from "@/src/application/use-cases/billing/GetBillingStateUseCase";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { CreateShopForm } from "@/src/presentation/components/admin/CreateShopForm";
import { ShopStatusToggle } from "@/src/presentation/components/admin/ShopStatusToggle";
import { ResetPasswordControl } from "@/src/presentation/components/auth/ResetPasswordControl";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  await requireRole("platform_admin");
  const [shops, categories] = await Promise.all([
    container.shopRepository.list(),
    container.shopCategoryRepository.listActive(),
  ]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const billing = new GetBillingStateUseCase(
    container.shopRepository,
    container.subscriptionRepository,
  );
  const [states, owners] = await Promise.all([
    Promise.all(shops.map((s) => billing.execute(s.id))),
    Promise.all(
      shops.map(async (s) => {
        const members = await container.userRepository.listByShop(s.id);
        return members.find((u) => u.role === "shop_owner") ?? null;
      }),
    ),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="เพิ่มร้านค้าใหม่ (สร้างบัญชีเจ้าของร้านด้วย)" />
        <CreateShopForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </Card>

      <Card>
        <CardHeader title={`ร้านค้าทั้งหมด (${shops.length})`} />
        {shops.length === 0 ? (
          <EmptyState icon={<Store />} title="ยังไม่มีร้านค้า" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {shops.map((shop, i) => {
              const { status } = states[i];
              const owner = owners[i];
              const adminSuspended = shop.status === "suspended_by_admin";
              return (
                <li
                  key={shop.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {shop.name}
                      {shop.categoryId && categoryName.has(shop.categoryId) && (
                        <span className="ml-2 text-xs font-normal text-muted">
                          · {categoryName.get(shop.categoryId)}
                        </span>
                      )}
                    </p>
                    <Link
                      href={`/s/${shop.slug}`}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      /s/{shop.slug}
                    </Link>
                    {owner && (
                      <p className="text-xs text-muted">เจ้าของ: {owner.email}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    {adminSuspended ? (
                      <Badge tone="danger">ระงับโดยแอดมิน</Badge>
                    ) : status.isSuspended ? (
                      <Badge tone="danger">ค้างชำระ (ระงับ)</Badge>
                    ) : status.state === "overdue" ? (
                      <Badge tone="warning">ค้าง {status.daysOverdue} วัน</Badge>
                    ) : (
                      <Badge tone="success">ปกติ</Badge>
                    )}
                    <ShopStatusToggle
                      shopId={shop.id}
                      adminSuspended={adminSuspended}
                    />
                    {owner && (
                      <ResetPasswordControl kind="owner" userId={owner.id} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
