import { Store, Gift, PartyPopper } from "lucide-react";
import type { CustomerCardView } from "@/src/domain/entities";
import { Badge } from "@/src/presentation/components/ui/Badge";
import { StampDots } from "@/src/presentation/components/ui/StampDots";
import { formatPhone } from "@/src/domain/services/phone";

/** Presentational customer stamp-card summary. */
export function CardBalance({
  view,
  shopName,
  dotSize = "md",
}: {
  view: CustomerCardView;
  /** When given, the card is titled by the shop (avatar + name); the customer
   *  becomes the subtitle. Omitted in staff contexts where the shop is implicit. */
  shopName?: string;
  dotSize?: "sm" | "md" | "lg";
}) {
  const { customer, card, threshold, rewardText, eligibleToRedeem, remaining } =
    view;
  const customerLabel = customer.displayName || formatPhone(customer.phone);
  const title = shopName ?? customerLabel;
  const subtitle = shopName
    ? customerLabel
    : customer.displayName
      ? formatPhone(customer.phone)
      : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header: shop/customer avatar + name + stamp counter */}
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <Store className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{title}</p>
          {subtitle && (
            <p className="truncate text-sm text-muted">{subtitle}</p>
          )}
        </div>
        {eligibleToRedeem ? (
          <Badge tone="success">
            <PartyPopper className="size-3.5" />
            ครบแล้ว
          </Badge>
        ) : (
          <Badge tone="brand">
            {card.currentStamps} / {threshold} ดวง
          </Badge>
        )}
      </div>

      <StampDots current={card.currentStamps} threshold={threshold} size={dotSize} />

      {/* Reward callout */}
      <div className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100">
        <Gift className="size-5 shrink-0 text-brand-600" />
        <p className="text-sm text-foreground">
          {eligibleToRedeem ? (
            <>
              สะสมครบ! แลกรับ{" "}
              <strong className="text-brand-700">{rewardText}</strong>
            </>
          ) : (
            <>
              อีก <strong className="text-brand-700">{remaining}</strong>{" "}
              ดวง แลกรับฟรี!
              {rewardText ? (
                <span className="text-muted"> · {rewardText}</span>
              ) : null}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
