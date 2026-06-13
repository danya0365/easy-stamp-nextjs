import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AddBranchForm } from "@/src/presentation/components/shop/AddBranchForm";
import { ToggleActiveButton } from "@/src/presentation/components/shop/ToggleActiveButton";

export const dynamic = "force-dynamic";

export default async function ShopBranchesPage() {
  const user = await requireRole("shop_owner");
  const branches = await container.branchRepository.listByShop(user.shopId!);

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader title="เพิ่มสาขา" />
        <AddBranchForm />
      </Card>

      <Card>
        <CardHeader title={`สาขาทั้งหมด (${branches.length})`} />
        {branches.length === 0 ? (
          <EmptyState icon="🏬" title="ยังไม่มีสาขา" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {branches.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between py-2.5"
              >
                <span className="text-foreground">{b.name}</span>
                <ToggleActiveButton kind="branch" id={b.id} isActive={b.isActive} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
