import { Star } from "lucide-react";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AdminReviewList } from "@/src/presentation/components/reviews/AdminReviewList";
import type { AdminReviewRow } from "@/src/presentation/actions/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireRole("platform_admin");
  const [page, shops] = await Promise.all([
    container.shopReviewRepository.pageAll(),
    container.shopRepository.list(),
  ]);
  const shopName = new Map(shops.map((s) => [s.id, s.name]));
  const rows: AdminReviewRow[] = page.items.map((review) => ({
    review,
    shopName: shopName.get(review.shopId) ?? review.shopId,
  }));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="รีวิวทั้งหมด"
          subtitle="ซ่อนรีวิวที่ไม่เหมาะสม/สแปม — รีวิวที่ซ่อนจะไม่แสดงบนหน้าร้าน"
        />
        {rows.length === 0 ? (
          <EmptyState icon={<Star />} title="ยังไม่มีรีวิว" />
        ) : (
          <AdminReviewList
            initialItems={rows}
            initialCursor={page.nextCursor}
          />
        )}
      </Card>
    </div>
  );
}
