import { requireRole } from "@/src/infrastructure/auth/session";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { ContactAdminForm } from "@/src/presentation/components/shop/ContactAdminForm";

export const dynamic = "force-dynamic";

export default async function ShopContactPage() {
  await requireRole("shop_owner");

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Card>
        <CardHeader
          title="ติดต่อผู้ดูแลระบบ"
          subtitle="มีปัญหาการใช้งานหรือการชำระเงิน ส่งข้อความถึงผู้ดูแล แล้วทิ้งช่องทางให้ติดต่อกลับ"
        />
        <ContactAdminForm />
      </Card>
    </div>
  );
}
