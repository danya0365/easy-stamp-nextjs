import { getTranslations } from "next-intl/server";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { StampStation } from "@/src/presentation/components/stamp/StampStation";

export const dynamic = "force-dynamic";

export default async function StaffHomePage() {
  const user = await requireRole("branch_staff");
  const t = await getTranslations("staffPages");
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
        <h1 className="text-xl font-bold text-foreground">{t("stampsTitle")}</h1>
        <p className="mt-1 text-sm text-muted">
          {branch ? t("branchLabel", { name: branch.name }) : t("branchStaffFallback")}
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
