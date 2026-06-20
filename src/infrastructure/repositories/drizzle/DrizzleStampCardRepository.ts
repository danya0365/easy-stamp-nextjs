import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { StampCard } from "@/src/domain/entities";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";

type Row = typeof schema.stampCards.$inferSelect;

function toCard(r: Row): StampCard {
  return {
    id: r.id,
    shopId: r.shopId,
    customerId: r.customerId,
    currentStamps: r.currentStamps,
    lifetimeStamps: r.lifetimeStamps,
    rewardsEarned: r.rewardsEarned,
    updatedAt: r.updatedAt,
  };
}

export class DrizzleStampCardRepository implements IStampCardRepository {
  async findByCustomer(
    shopId: string,
    customerId: string,
  ): Promise<StampCard | null> {
    const r = await db.query.stampCards.findFirst({
      where: and(
        eq(schema.stampCards.shopId, shopId),
        eq(schema.stampCards.customerId, customerId),
      ),
    });
    return r ? toCard(r) : null;
  }

  async findOrCreate(shopId: string, customerId: string): Promise<StampCard> {
    const existing = await this.findByCustomer(shopId, customerId);
    if (existing) return existing;
    const [r] = await db
      .insert(schema.stampCards)
      .values({ shopId, customerId })
      .returning();
    return toCard(r);
  }

  async addStamps(cardId: string, delta: number): Promise<StampCard> {
    const lifetimeDelta = Math.max(delta, 0);
    const [r] = await db
      .update(schema.stampCards)
      .set({
        currentStamps: sql`${schema.stampCards.currentStamps} + ${delta}`,
        lifetimeStamps: sql`${schema.stampCards.lifetimeStamps} + ${lifetimeDelta}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.stampCards.id, cardId))
      .returning();
    return toCard(r);
  }

  async applyRedemption(cardId: string, threshold: number): Promise<StampCard> {
    const [r] = await db
      .update(schema.stampCards)
      .set({
        currentStamps: sql`${schema.stampCards.currentStamps} - ${threshold}`,
        rewardsEarned: sql`${schema.stampCards.rewardsEarned} + 1`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.stampCards.id, cardId))
      .returning();
    return toCard(r);
  }
}
