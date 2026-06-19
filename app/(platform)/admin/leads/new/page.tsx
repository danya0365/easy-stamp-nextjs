import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { Button } from "@/src/presentation/components/ui/Button";
import { LeadCreateMapPicker } from "@/src/presentation/components/leads/LeadCreateMapPicker";

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  await requireRole("platform_admin");
  const categories = await container.shopCategoryRepository.listActive();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-foreground">เพิ่มลีดจากแผนที่</h1>
        <Link href="/admin/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} />
            รายการลีด
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader
          title="เลือกร้านบนแผนที่"
          subtitle="ค้นหาย่าน เลื่อนแผนที่ แล้วแตะหมุดร้าน — ระบบจะดึงชื่อ/หมวดหมู่/เบอร์/ที่อยู่มาให้ เหลือแค่ตรวจและบันทึก"
        />
        <LeadCreateMapPicker
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))}
        />
      </Card>
    </div>
  );
}
