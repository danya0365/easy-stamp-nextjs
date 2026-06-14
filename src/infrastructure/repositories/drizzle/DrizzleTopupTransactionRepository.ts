import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { TopupTransaction } from "@/src/domain/entities";
import type {
  CreateTopupTransactionInput,
  ITopupTransactionRepository,
} from "@/src/application/repositories/ITopupTransactionRepository";

type Row = typeof schema.topupTransactions.$inferSelect;

function toTx(r: Row): TopupTransaction {
  return {
    id: r.id,
    shopId: r.shopId,
    paymentId: r.paymentId,
    type: r.type,
    daysAdded: r.daysAdded,
    bonusDaysAdded: r.bonusDaysAdded,
    amountSatang: r.amountSatang,
    expiryBeforeAt: r.expiryBeforeAt,
    expiryAfterAt: r.expiryAfterAt,
    performedBy: r.performedBy,
    note: r.note,
    createdAt: r.createdAt,
  };
}

export class DrizzleTopupTransactionRepository
  implements ITopupTransactionRepository
{
  async create(input: CreateTopupTransactionInput): Promise<TopupTransaction> {
    const [r] = await db
      .insert(schema.topupTransactions)
      .values({
        shopId: input.shopId,
        paymentId: input.paymentId ?? null,
        type: input.type,
        daysAdded: input.daysAdded,
        bonusDaysAdded: input.bonusDaysAdded,
        amountSatang: input.amountSatang,
        expiryBeforeAt: input.expiryBeforeAt ?? null,
        expiryAfterAt: input.expiryAfterAt,
        performedBy: input.performedBy,
        note: input.note ?? null,
      })
      .returning();
    return toTx(r);
  }

  async listByShop(shopId: string, limit = 20): Promise<TopupTransaction[]> {
    const rows = await db.query.topupTransactions.findMany({
      where: eq(schema.topupTransactions.shopId, shopId),
      orderBy: desc(schema.topupTransactions.createdAt),
      limit,
    });
    return rows.map(toTx);
  }
}
