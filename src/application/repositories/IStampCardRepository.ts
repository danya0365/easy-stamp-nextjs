import type { StampCard } from "@/src/domain/entities";

export interface IStampCardRepository {
  findByCustomer(shopId: string, customerId: string): Promise<StampCard | null>;
  /** Find an existing card for the customer or create an empty one. */
  findOrCreate(shopId: string, customerId: string): Promise<StampCard>;
  /** Add `delta` stamps to currentStamps; bumps lifetimeStamps by max(delta, 0). */
  addStamps(cardId: string, delta: number): Promise<StampCard>;
  /**
   * Apply a redemption: subtract `threshold` from currentStamps and bump
   * rewardsEarned by 1. Must be called only when eligible.
   */
  applyRedemption(cardId: string, threshold: number): Promise<StampCard>;
}
