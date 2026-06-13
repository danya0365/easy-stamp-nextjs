import { Building2 } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AddBranchForm } from "@/src/presentation/components/shop/AddBranchForm";
import { ToggleActiveButton } from "@/src/presentation/components/shop/ToggleActiveButton";
import { BranchLocationEditor } from "@/src/presentation/components/map/BranchLocationEditor";

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
          <EmptyState icon={<Building2 />} title="ยังไม่มีสาขา" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {branches.map((b) => (
              <li key={b.id} className="flex flex-col gap-2 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground">{b.name}</span>
                  <ToggleActiveButton
                    kind="branch"
                    id={b.id}
                    isActive={b.isActive}
                  />
                </div>
                <BranchLocationEditor
                  branchId={b.id}
                  latitude={b.latitude}
                  longitude={b.longitude}
                  address={b.address}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
