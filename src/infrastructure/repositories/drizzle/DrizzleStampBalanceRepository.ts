import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { StampBalance } from "@/src/domain/entities";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";

type Row = typeof schema.stampBalances.$inferSelect;

function toBalance(r: Row): StampBalance {
  return {
    id: r.id,
    cardId: r.cardId,
    stampTypeId: r.stampTypeId,
    currentStamps: r.currentStamps,
    lifetimeStamps: r.lifetimeStamps,
    rewardsEarned: r.rewardsEarned,
    updatedAt: r.updatedAt,
  };
}

export class DrizzleStampBalanceRepository implements IStampBalanceRepository {
  async findByCardAndType(
    cardId: string,
    stampTypeId: string,
  ): Promise<StampBalance | null> {
    const r = await db.query.stampBalances.findFirst({
      where: and(
        eq(schema.stampBalances.cardId, cardId),
        eq(schema.stampBalances.stampTypeId, stampTypeId),
      ),
    });
    return r ? toBalance(r) : null;
  }

  async findOrCreate(
    cardId: string,
    stampTypeId: string,
  ): Promise<StampBalance> {
    const existing = await this.findByCardAndType(cardId, stampTypeId);
    if (existing) return existing;
    const [r] = await db
      .insert(schema.stampBalances)
      .values({ cardId, stampTypeId })
      .returning();
    return toBalance(r);
  }

  async listByCard(cardId: string): Promise<StampBalance[]> {
    const rows = await db.query.stampBalances.findMany({
      where: eq(schema.stampBalances.cardId, cardId),
    });
    return rows.map(toBalance);
  }

  async addStamps(id: string, delta: number): Promise<StampBalance> {
    const lifetimeDelta = Math.max(delta, 0);
    const [r] = await db
      .update(schema.stampBalances)
      .set({
        currentStamps: sql`${schema.stampBalances.currentStamps} + ${delta}`,
        lifetimeStamps: sql`${schema.stampBalances.lifetimeStamps} + ${lifetimeDelta}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.stampBalances.id, id))
      .returning();
    return toBalance(r);
  }

  async applyRedemption(id: string, threshold: number): Promise<StampBalance> {
    const [r] = await db
      .update(schema.stampBalances)
      .set({
        currentStamps: sql`${schema.stampBalances.currentStamps} - ${threshold}`,
        rewardsEarned: sql`${schema.stampBalances.rewardsEarned} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.stampBalances.id, id))
      .returning();
    return toBalance(r);
  }
}
