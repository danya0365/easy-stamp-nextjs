"use client";

import { useActionState } from "react";

import {
  replyToReviewAction,
  loadMoreShopReviewsAction,
  type FormState,
} from "@/src/presentation/actions/shop-actions";
import type { ShopReview } from "@/src/domain/entities";
import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { Textarea } from "@/src/presentation/components/ui/Textarea";
import { Button } from "@/src/presentation/components/ui/Button";
import { ReviewItem } from "./ReviewItem";

function ReplyBox({ review }: { review: ShopReview }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    replyToReviewAction,
    {},
  );
  return (
    <form action={action} className="mt-1 flex flex-col gap-2">
      <input type="hidden" name="reviewId" value={review.id} />
      <Textarea
        name="reply"
        rows={2}
        maxLength={1000}
        defaultValue={review.ownerReply ?? ""}
        placeholder="ตอบกลับรีวิวนี้…"
      />
      {state.error && <p className="text-sm text-error">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <div>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "กำลังบันทึก…" : review.ownerReply ? "แก้ไขคำตอบ" : "ตอบกลับ"}
        </Button>
      </div>
    </form>
  );
}

function OwnerReviewItem({ review }: { review: ShopReview }) {
  return (
    <ReviewItem
      review={review}
      actions={
        <>
          {review.isHidden && (
            <Badge tone="danger">ถูกซ่อนโดยผู้ดูแล</Badge>
          )}
          <ReplyBox review={review} />
        </>
      }
    />
  );
}

export function OwnerReviewList({
  initialItems,
  initialCursor,
}: {
  initialItems: ShopReview[];
  initialCursor: string | null;
}) {
  return (
    <LoadMore<ShopReview>
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={(cursor) => loadMoreShopReviewsAction(cursor)}
      getKey={(r) => r.id}
      renderItem={(r) => <OwnerReviewItem review={r} />}
    />
  );
}
