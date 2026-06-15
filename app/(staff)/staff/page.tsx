import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { StampStation } from "@/src/presentation/components/stamp/StampStation";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { ChangePasswordForm } from "@/src/presentation/components/auth/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function StaffHomePage() {
  const user = await requireRole("branch_staff");
  const [branch, stampTypes] = await Promise.all([
    user.branchId
      ? container.branchRepository.findById(user.branchId)
      : Promise.resolve(null),
    container.stampTypeRepository.listByShop(user.shopId!, { activeOnly: true }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">เพิ่ม / แลกแสตมป์</h1>
        <p className="mt-1 text-sm text-muted">
          {branch ? `สาขา: ${branch.name}` : "พนักงานสาขา"}
        </p>
      </div>
      <StampStation stampTypes={stampTypes} />

      <Card className="max-w-lg">
        <CardHeader title="เปลี่ยนรหัสผ่าน" />
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
