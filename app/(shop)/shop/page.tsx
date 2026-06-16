import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { StatCard } from "@/src/presentation/components/ui/StatCard";
import { ContactAdminButton } from "@/src/presentation/components/shop/ContactAdminButton";

export const dynamic = "force-dynamic";

export default async function ShopDashboardPage() {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const [shop, branches, users, customers, redemptions, stampTypes] =
    await Promise.all([
      container.shopRepository.findById(shopId),
      container.branchRepository.listByShop(shopId),
      container.userRepository.listByShop(shopId),
      container.customerRepository.listByShop(shopId),
      container.rewardRedemptionRepository.listByShop(shopId, 100),
      container.stampTypeRepository.listByShop(shopId, { activeOnly: true }),
    ]);
  const staffCount = users.filter((u) => u.role === "branch_staff").length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">{shop?.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {stampTypes.length === 1
            ? `ครบ ${stampTypes[0].threshold} ดวง = ${stampTypes[0].rewardText || "ของรางวัล"}`
            : `${stampTypes.length} ประเภทแสตมป์`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="ประเภทแสตมป์" value={stampTypes.length} />
        <StatCard label="สาขา" value={branches.length} />
        <StatCard label="พนักงาน" value={staffCount} />
        <StatCard label="ลูกค้า" value={customers.length} />
        <StatCard label="แลกรางวัลแล้ว" value={redemptions.length} />
      </div>

      <Card>
        <p className="mb-2 font-medium text-foreground">ทางลัด</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/shop/stamps"
            className="inline-flex items-center gap-1 text-brand-700 hover:underline"
          >
            เพิ่ม/แลกแสตมป์
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/shop/settings"
            className="inline-flex items-center gap-1 text-brand-700 hover:underline"
          >
            ตั้งค่าร้าน
            <ArrowRight className="size-4" />
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
