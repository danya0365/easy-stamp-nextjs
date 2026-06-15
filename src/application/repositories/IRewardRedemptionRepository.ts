import type { RewardRedemption } from "@/src/domain/entities";

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
}
