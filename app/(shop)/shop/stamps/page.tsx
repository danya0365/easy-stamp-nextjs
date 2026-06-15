import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { StampStation } from "@/src/presentation/components/stamp/StampStation";

export const dynamic = "force-dynamic";

export default async function ShopStampsPage() {
  const user = await requireRole("shop_owner");
  const stampTypes = await container.stampTypeRepository.listByShop(
    user.shopId!,
    { activeOnly: true },
  );
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">เพิ่ม / แลกแสตมป์</h1>
      <StampStation stampTypes={stampTypes} />
    </div>
  );
}
