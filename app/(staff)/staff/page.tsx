import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { StampStation } from "@/src/presentation/components/stamp/StampStation";

export const dynamic = "force-dynamic";

export default async function StaffHomePage() {
  const user = await requireRole("branch_staff");
  const [branch, stampTypes, customers] = await Promise.all([
    user.branchId
      ? container.branchRepository.findById(user.branchId)
      : Promise.resolve(null),
    container.stampTypeRepository.listByShop(user.shopId!, { activeOnly: true }),
    container.customerRepository.listByShop(user.shopId!),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">เพิ่ม / แลกแสตมป์</h1>
        <p className="mt-1 text-sm text-muted">
          {branch ? `สาขา: ${branch.name}` : "พนักงานสาขา"}
        </p>
      </div>
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
