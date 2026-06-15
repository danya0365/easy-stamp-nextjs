import type {
  Customer,
  CustomerCardView,
  StampBalance,
  StampType,
} from "../entities";

/**
 * Build the derived multi-type card view. `types` should already be the shop's
 * ACTIVE types in display order; `balances` are this customer's rows (a missing
 * balance for a type means zero stamps). eligibility/remaining are derived per
 * type from its own threshold.
 */
export function buildCardView(
  types: StampType[],
  customer: Customer,
  balances: StampBalance[],
): CustomerCardView {
  const byType = new Map(balances.map((b) => [b.stampTypeId, b]));
  return {
    customer,
    types: types.map((type) => {
      const b = byType.get(type.id);
      const currentStamps = b?.currentStamps ?? 0;
      return {
        type,
        currentStamps,
        lifetimeStamps: b?.lifetimeStamps ?? 0,
        rewardsEarned: b?.rewardsEarned ?? 0,
        eligibleToRedeem: currentStamps >= type.threshold,
        remaining: Math.max(0, type.threshold - currentStamps),
      };
    }),
  };
}
