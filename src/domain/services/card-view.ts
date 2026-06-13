import type { Customer, CustomerCardView, Shop, StampCard } from "../entities";

/** Build the derived customer card view (eligibility/remaining) from raw rows. */
export function buildCardView(
  shop: Pick<Shop, "stampThreshold" | "rewardText">,
  customer: Customer,
  card: StampCard,
): CustomerCardView {
  const threshold = shop.stampThreshold;
  const eligibleToRedeem = card.currentStamps >= threshold;
  return {
    customer,
    card,
    threshold,
    rewardText: shop.rewardText,
    eligibleToRedeem,
    remaining: Math.max(0, threshold - card.currentStamps),
  };
}
