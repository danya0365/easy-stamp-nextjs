import type { Branch } from "@/src/domain/entities";

export interface CreateBranchInput {
  shopId: string;
  name: string;
}

export interface IBranchRepository {
  create(input: CreateBranchInput): Promise<Branch>;
  findById(id: string): Promise<Branch | null>;
  listByShop(shopId: string): Promise<Branch[]>;
  setActive(id: string, isActive: boolean): Promise<Branch>;
}
