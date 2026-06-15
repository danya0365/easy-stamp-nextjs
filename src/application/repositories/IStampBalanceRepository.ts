import type { StampBalance } from "@/src/domain/entities";

export interface IStampBalanceRepository {
  findByCardAndType(
    cardId: string,
    stampTypeId: string,
  ): Promise<StampBalance | null>;
  /** Find the balance for (card, type) or create an empty one. */
  findOrCreate(cardId: string, stampTypeId: string): Promise<StampBalance>;
  /** All balances on a card (one per stamp type the customer has touched). */
  listByCard(cardId: string): Promise<StampBalance[]>;
  /** Add `delta` to currentStamps; bumps lifetimeStamps by max(delta, 0). */
  addStamps(id: string, delta: number): Promise<StampBalance>;
  /** Subtract `threshold` from currentStamps and bump rewardsEarned by 1. */
  applyRedemption(id: string, threshold: number): Promise<StampBalance>;
}
