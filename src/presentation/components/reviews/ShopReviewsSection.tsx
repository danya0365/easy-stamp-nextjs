import { MessageSquare } from "lucide-react";

import type { Page } from "@/src/application/repositories/pagination";
import type { ReviewSummary, ShopReview } from "@/src/domain/entities";
import { Card, CardHeader } from "@/src/presentation/components/ui/Card";
import { EmptyState } from "@/src/presentation/components/ui/EmptyState";
import { StarRating } from "@/src/presentation/components/ui/StarRating";
import { ReviewForm } from "./ReviewForm";
import { PublicReviewList } from "./PublicReviewList";

/**
 * Public reviews block: average summary, the review form (bound members only),
 * and the paginated list.
 */
export function ShopReviewsSection({
  slug,
  shopId,
  summary,
  initial,
  myReview,
  canReview,
}: {
  slug: string;
  shopId: string;
  summary: ReviewSummary;
  initial: Page<ShopReview>;
  myReview: ShopReview | null;
  canReview: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title="รีวิว"
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

      {canReview ? (
        <div className="mb-4 rounded-xl border border-border p-3">
          <ReviewForm slug={slug} existing={myReview} />
        </div>
      ) : (
        <p className="mb-4 text-xs text-muted">
          ผูกบัตรสมาชิกกับร้านนี้ (สแกน QR ที่ร้าน) เพื่อรีวิว
        </p>
      )}

      {initial.items.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title="ยังไม่มีรีวิว" />
      ) : (
        <PublicReviewList
          shopId={shopId}
          initialItems={initial.items}
          initialCursor={initial.nextCursor}
        />
      )}
    </Card>
  );
}
