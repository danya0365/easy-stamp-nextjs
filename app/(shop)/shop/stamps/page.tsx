import { requireRole } from "@/src/infrastructure/auth/session";
import { StampStation } from "@/src/presentation/components/stamp/StampStation";

export const dynamic = "force-dynamic";

export default async function ShopStampsPage() {
  await requireRole("shop_owner");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-foreground">เพิ่ม / แลกแสตมป์</h1>
      <StampStation />
    </div>
  );
}
