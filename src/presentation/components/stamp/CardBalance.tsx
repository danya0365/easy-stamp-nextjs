import type { CustomerCardView } from "@/src/domain/entities";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StampDots } from "@/src/presentation/components/ui/StampDots";
import { formatPhone } from "@/src/domain/services/phone";

/** Presentational customer stamp-card summary. */
export function CardBalance({
  view,
  dotSize = "md",
}: {
  view: CustomerCardView;
  dotSize?: "sm" | "md" | "lg";
}) {
  const { customer, card, threshold, rewardText, eligibleToRedeem, remaining } =
    view;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">
            {customer.displayName || formatPhone(customer.phone)}
          </p>
          {customer.displayName && (
            <p className="text-sm text-muted">{formatPhone(customer.phone)}</p>
          )}
        </div>
        {eligibleToRedeem ? (
          <Badge tone="success">🎉 ครบแล้ว แลกได้</Badge>
        ) : (
          <Badge tone="brand">
            {card.currentStamps}/{threshold} ดวง
          </Badge>
        )}
      </div>

      <StampDots current={card.currentStamps} threshold={threshold} size={dotSize} />

      <p className="text-sm text-muted">
        {eligibleToRedeem ? (
          <>
            สะสมครบ! แลกรับ: <strong className="text-brand-700">{rewardText}</strong>
          </>
        ) : (
          <>
            อีก <strong className="text-brand-700">{remaining}</strong> ดวงครบรางวัล
            {rewardText ? ` · ${rewardText}` : ""}
          </>
        )}
      </p>
    </div>
  );
}
