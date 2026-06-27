import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { requireRole } from "@/src/infrastructure/auth/session";
import { container } from "@/src/infrastructure/di/container";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { AdminReviewList } from "@/src/presentation/components/reviews/AdminReviewList";
import type { AdminReviewRow } from "@/src/presentation/actions/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  await requireRole("platform_admin");
  const t = await getTranslations("adminPages");
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
          title={t("reviewsTitle")}
          subtitle={t("reviewsSubtitle")}
        />
        {rows.length === 0 ? (
          <EmptyState icon={<Star />} title={t("noReviews")} />
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
