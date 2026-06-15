import type { StampType } from "@/src/domain/entities";

export interface CreateStampTypeInput {
  shopId: string;
  name: string;
  threshold: number;
  rewardText: string;
  priceSatang?: number | null;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdateStampTypeInput {
  name?: string;
  threshold?: number;
  rewardText?: string;
  priceSatang?: number | null;
  sortOrder?: number;
}

export interface IStampTypeRepository {
  create(input: CreateStampTypeInput): Promise<StampType>;
  findById(id: string): Promise<StampType | null>;
  /** Types for a shop, ordered sortOrder then createdAt. activeOnly filters isActive. */
  listByShop(
    shopId: string,
    opts?: { activeOnly?: boolean },
  ): Promise<StampType[]>;
  findDefault(shopId: string): Promise<StampType | null>;
  countActive(shopId: string): Promise<number>;
  update(id: string, input: UpdateStampTypeInput): Promise<StampType>;
  setActive(id: string, isActive: boolean): Promise<StampType>;
}
