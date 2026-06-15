import type { RewardRedemption } from "@/src/domain/entities";
import type { Page, PageOpts } from "./pagination";

export interface CreateRedemptionInput {
  shopId: string;
  branchId?: string | null;
  customerId: string;
  cardId: string;
  stampTypeId?: string | null;
  rewardTextSnapshot: string;
  stampsSpent: number;
  performedBy: string;
}

export interface IRewardRedemptionRepository {
  create(input: CreateRedemptionInput): Promise<RewardRedemption>;
  listByShop(shopId: string, limit?: number): Promise<RewardRedemption[]>;
  listByCustomer(
    shopId: string,
    customerId: string,
    limit?: number,
  ): Promise<RewardRedemption[]>;
  /** Cursor-paginated, newest first (shop history page). */
  pageByShop(shopId: string, opts?: PageOpts): Promise<Page<RewardRedemption>>;
  /** Cursor-paginated, newest first (customer's own card). */
  pageByCustomer(
    shopId: string,
    customerId: string,
    opts?: PageOpts,
  ): Promise<Page<RewardRedemption>>;
}
