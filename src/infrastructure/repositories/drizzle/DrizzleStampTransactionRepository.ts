import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { StampTransaction } from "@/src/domain/entities";
import type {
  CreateStampTransactionInput,
  IStampTransactionRepository,
} from "@/src/application/repositories/IStampTransactionRepository";

type Row = typeof schema.stampTransactions.$inferSelect;

function toTx(r: Row): StampTransaction {
  return {
    id: r.id,
    shopId: r.shopId,
    branchId: r.branchId,
    customerId: r.customerId,
    cardId: r.cardId,
    type: r.type,
    quantity: r.quantity,
    performedBy: r.performedBy,
    note: r.note,
    createdAt: r.createdAt,
  };
}

export class DrizzleStampTransactionRepository
  implements IStampTransactionRepository
{
  async create(input: CreateStampTransactionInput): Promise<StampTransaction> {
    const [r] = await db
      .insert(schema.stampTransactions)
      .values({
        shopId: input.shopId,
        branchId: input.branchId ?? null,
        customerId: input.customerId,
        cardId: input.cardId,
        type: input.type,
        quantity: input.quantity,
        performedBy: input.performedBy,
        note: input.note ?? null,
      })
      .returning();
    return toTx(r);
  }

  async listByCustomer(
    shopId: string,
    customerId: string,
    limit = 20,
  ): Promise<StampTransaction[]> {
    const rows = await db.query.stampTransactions.findMany({
      where: and(
        eq(schema.stampTransactions.shopId, shopId),
        eq(schema.stampTransactions.customerId, customerId),
      ),
      orderBy: desc(schema.stampTransactions.createdAt),
      limit,
    });
    return rows.map(toTx);
  }
}
