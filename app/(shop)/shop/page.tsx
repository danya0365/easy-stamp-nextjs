import Link from "next/link";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { ContactAdminButton } from "@/src/presentation/components/shop/ContactAdminButton";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-2xl font-bold text-brand-600">{value}</span>
      <span className="text-sm text-muted">{label}</span>
    </Card>
  );
}

export default async function ShopDashboardPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const [shop, branches, users, customers, redemptions] = await Promise.all([
    container.shopRepository.findById(shopId),
    container.branchRepository.listByShop(shopId),
    container.userRepository.listByShop(shopId),
    container.customerRepository.listByShop(shopId),
    container.rewardRedemptionRepository.listByShop(shopId, 100),
  ]);
  const staffCount = users.filter((u) => u.role === "branch_staff").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">{shop?.name}</h1>
        <p className="mt-1 text-sm text-muted">
          ครบ {shop?.stampThreshold} ดวง = {shop?.rewardText || "ของรางวัล"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="สาขา" value={branches.length} />
        <Stat label="พนักงาน" value={staffCount} />
        <Stat label="ลูกค้า" value={customers.length} />
        <Stat label="แลกรางวัลแล้ว" value={redemptions.length} />
      </div>

      <Card>
        <p className="mb-2 font-medium text-foreground">ทางลัด</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/shop/stamps" className="text-brand-700 hover:underline">
            เพิ่ม/แลกแสตมป์ →
          </Link>
          <Link href="/shop/settings" className="text-brand-700 hover:underline">
            ตั้งค่าร้าน →
          </Link>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="ต้องการความช่วยเหลือ?"
          subtitle="มีปัญหาการใช้งานหรือการชำระเงิน ติดต่อผู้ดูแลได้เลย"
        />
        <ContactAdminButton />
      </Card>
    </div>
  );
}
