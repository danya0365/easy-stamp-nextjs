import type { StampTransaction, StampTxType } from "@/src/domain/entities";

export interface CreateStampTransactionInput {
  shopId: string;
  branchId?: string | null;
  customerId: string;
  cardId: string;
  type: StampTxType;
  quantity: number;
  performedBy: string;
  note?: string | null;
}

export interface IStampTransactionRepository {
  create(input: CreateStampTransactionInput): Promise<StampTransaction>;
  listByCustomer(
    shopId: string,
    customerId: string,
    limit?: number,
  ): Promise<StampTransaction[]>;
}
