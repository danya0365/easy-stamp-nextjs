"use client";

import type { Payment, PaymentStatus } from "@/src/domain/entities";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { LoadMore } from "@/src/presentation/components/ui/LoadMore";
import { satangToBaht } from "@/src/presentation/lib/money";
import { formatDate } from "@/src/presentation/lib/format-date";
import { loadMorePaymentsAction } from "@/src/presentation/actions/billing-actions";

const PAYMENT_BADGE: Record<
  PaymentStatus,
  { tone: "warning" | "success" | "danger"; label: string }
> = {
  pending: { tone: "warning", label: "รอตรวจสอบ" },
  approved: { tone: "success", label: "อนุมัติแล้ว" },
  rejected: { tone: "danger", label: "ปฏิเสธ" },
};

function PaymentRow({ p }: { p: Payment }) {
  const badge = PAYMENT_BADGE[p.status];
  const totalDays = p.daysToAdd + p.bonusDays;
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <div>
        <p className="text-foreground">
          ฿{satangToBaht(p.amountSatang)} ·{" "}
          <span className="text-muted">
            {totalDays} วัน{p.bonusDays > 0 ? ` (แถม ${p.bonusDays})` : ""}
          </span>
        </p>
        <p className="text-xs text-muted">{formatDate(p.createdAt)}</p>
        {p.status === "rejected" && p.rejectReason && (
          <p className="text-xs text-error">เหตุผล: {p.rejectReason}</p>
        )}
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
    </li>
  );
}

/** Cursor-paginated billing/top-up history for a shop. */
export function PaymentHistoryList({
  initialItems,
  initialCursor,
}: {
  initialItems: Payment[];
  initialCursor: string | null;
}) {
  return (
    <LoadMore
      initialItems={initialItems}
      initialCursor={initialCursor}
      loadMore={loadMorePaymentsAction}
      getKey={(p) => p.id}
      renderItem={(p) => <PaymentRow p={p} />}
    />
  );
}
