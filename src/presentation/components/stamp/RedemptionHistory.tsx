import { Gift } from "lucide-react";

import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { formatDateTime } from "@/src/presentation/lib/format-date";
import type { RedemptionItem } from "@/src/application/use-cases/stamp/BuildRedemptionItemsUseCase";

export type { RedemptionItem };

/** A single redemption row (full `<li>`). */
export function RedemptionRow({
  item: r,
  showCustomer = false,
}: {
  item: RedemptionItem;
  showCustomer?: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
          <Gift className="size-4 shrink-0 text-brand-500" />
          {r.rewardTextSnapshot || "ของรางวัล"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {showCustomer && r.customerLabel ? `${r.customerLabel} · ` : ""}
          {formatDateTime(r.createdAt)}
          {r.branchLabel ? ` · ${r.branchLabel}` : ""}
        </p>
      </div>
      <Badge tone="neutral">−{r.stampsSpent} ดวง</Badge>
    </li>
  );
}

/**
 * Shared list of past reward redemptions. Used on the shop history page
 * (showCustomer) and the customer's own card page.
 */
export function RedemptionHistory({
  items,
  showCustomer = false,
}: {
  items: RedemptionItem[];
  showCustomer?: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Gift />}
        title="ยังไม่มีประวัติการแลกรางวัล"
        description="เมื่อมีการแลกของรางวัล รายการจะแสดงที่นี่"
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((r) => (
        <RedemptionRow key={r.id} item={r} showCustomer={showCustomer} />
      ))}
    </ul>
  );
}
