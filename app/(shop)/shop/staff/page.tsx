import { User } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AddStaffForm } from "@/src/presentation/components/shop/AddStaffForm";
import { ToggleActiveButton } from "@/src/presentation/components/shop/ToggleActiveButton";
import { ResetPasswordControl } from "@/src/presentation/components/auth/ResetPasswordControl";

export const dynamic = "force-dynamic";

export default async function ShopStaffPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const [branches, users] = await Promise.all([
    container.branchRepository.listByShop(shopId),
    container.userRepository.listByShop(shopId),
  ]);
  const staff = users.filter((u) => u.role === "branch_staff");
  const branchName = new Map(branches.map((b) => [b.id, b.name]));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="เพิ่มพนักงานสาขา" />
        <AddStaffForm branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
      </Card>

      <Card>
        <CardHeader title={`พนักงานทั้งหมด (${staff.length})`} />
        {staff.length === 0 ? (
          <EmptyState icon={<User />} title="ยังไม่มีพนักงาน" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {staff.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div>
                  <p className="text-foreground">{s.email}</p>
                  <p className="text-xs text-muted">
                    {s.branchId ? branchName.get(s.branchId) ?? "—" : "—"}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <ToggleActiveButton
                    kind="staff"
                    id={s.id}
                    isActive={s.isActive}
                  />
                  <ResetPasswordControl kind="staff" userId={s.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
