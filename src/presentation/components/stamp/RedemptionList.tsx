"use client";

import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import {
  loadMoreShopRedemptionsAction,
  loadMoreMyRedemptionsAction,
} from "@/src/presentation/actions/stamp-actions";
import { RedemptionRow, type RedemptionItem } from "./RedemptionHistory";

/**
 * Cursor-paginated redemption history. `mode="shop"` shows the customer label;
 * `mode="my"` is the customer's own history for one shop (needs `slug`).
 */
export function RedemptionList({
  initialItems,
  initialCursor,
  mode,
  slug,
}: {
  initialItems: RedemptionItem[];
  initialCursor: string | null;
  mode: "shop" | "my";
  slug?: string;
}) {
  const loadMore =
    mode === "shop"
      ? loadMoreShopRedemptionsAction
      : (cursor: string) => loadMoreMyRedemptionsAction(slug!, cursor);

  return (
    <LoadMore
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={loadMore}
      getKey={(r) => r.id}
      renderItem={(r) => <RedemptionRow item={r} showCustomer={mode === "shop"} />}
    />
  );
}
