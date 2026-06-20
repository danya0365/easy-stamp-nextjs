import { Star } from "lucide-react";

import { requireShopAccess } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { StarRating } from "@/src/presentation/components/ui/StarRating";
import { OwnerReviewList } from "@/src/presentation/components/reviews/OwnerReviewList";

export const dynamic = "force-dynamic";

export default async function ShopReviewsPage() {
  const { shopId } = await requireShopAccess();
  const [summary, page] = await Promise.all([
    container.shopReviewRepository.summary(shopId),
    container.shopReviewRepository.pageByShop(shopId, { includeHidden: true }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="รีวิวจากลูกค้า"
          subtitle={
            summary.count > 0
              ? `${summary.average.toFixed(1)} จาก ${summary.count} รีวิว`
              : "ยังไม่มีรีวิว"
          }
          action={
            summary.count > 0 ? (
              <StarRating value={summary.average} size="sm" />
            ) : undefined
          }
        />
        {page.items.length === 0 ? (
          <EmptyState icon={<Star />} title="ยังไม่มีรีวิว" />
        ) : (
          <OwnerReviewList
            initialItems={page.items}
            initialCursor={page.nextCursor}
          />
        )}
      </Card>
    </div>
  );
}
