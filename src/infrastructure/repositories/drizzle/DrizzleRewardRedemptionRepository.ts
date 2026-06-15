import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { RewardRedemption } from "@/src/domain/entities";
import type {
  CreateRedemptionInput,
  IRewardRedemptionRepository,
} from "@/src/application/repositories/IRewardRedemptionRepository";
import type { Page, PageOpts } from "@/src/application/repositories/pagination";
import { decodeCursor } from "@/src/application/repositories/pagination";
import { cursorWhere, toPage } from "./_cursor";

type Row = typeof schema.rewardRedemptions.$inferSelect;

function toRedemption(r: Row): RewardRedemption {
  return {
    id: r.id,
    shopId: r.shopId,
    branchId: r.branchId,
    customerId: r.customerId,
    cardId: r.cardId,
    stampTypeId: r.stampTypeId,
    rewardTextSnapshot: r.rewardTextSnapshot,
    stampsSpent: r.stampsSpent,
    performedBy: r.performedBy,
    createdAt: r.createdAt,
  };
}

export class DrizzleRewardRedemptionRepository
  implements IRewardRedemptionRepository
{
  async create(input: CreateRedemptionInput): Promise<RewardRedemption> {
    const [r] = await db
      .insert(schema.rewardRedemptions)
      .values({
        shopId: input.shopId,
        branchId: input.branchId ?? null,
        customerId: input.customerId,
        cardId: input.cardId,
        stampTypeId: input.stampTypeId ?? null,
        rewardTextSnapshot: input.rewardTextSnapshot,
        stampsSpent: input.stampsSpent,
        performedBy: input.performedBy,
      })
      .returning();
    return toRedemption(r);
  }

  async listByShop(shopId: string, limit = 50): Promise<RewardRedemption[]> {
    const rows = await db.query.rewardRedemptions.findMany({
      where: eq(schema.rewardRedemptions.shopId, shopId),
      orderBy: desc(schema.rewardRedemptions.createdAt),
      limit,
    });
    return rows.map(toRedemption);
  }

  async listByCustomer(
    shopId: string,
    customerId: string,
    limit = 20,
  ): Promise<RewardRedemption[]> {
    const rows = await db.query.rewardRedemptions.findMany({
      where: and(
        eq(schema.rewardRedemptions.shopId, shopId),
        eq(schema.rewardRedemptions.customerId, customerId),
      ),
      orderBy: desc(schema.rewardRedemptions.createdAt),
      limit,
    });
    return rows.map(toRedemption);
  }

  async pageByShop(
    shopId: string,
    opts: PageOpts = {},
  ): Promise<Page<RewardRedemption>> {
    const limit = opts.limit ?? 20;
    const cur = decodeCursor(opts.cursor);
    const rows = await db.query.rewardRedemptions.findMany({
      where: and(
        eq(schema.rewardRedemptions.shopId, shopId),
        cursorWhere(
          schema.rewardRedemptions.createdAt,
          schema.rewardRedemptions.id,
          cur,
        ),
      ),
      orderBy: [
        desc(schema.rewardRedemptions.createdAt),
        desc(schema.rewardRedemptions.id),
      ],
      limit: limit + 1,
    });
    return toPage(rows.map(toRedemption), limit);
  }

  async pageByCustomer(
    shopId: string,
    customerId: string,
    opts: PageOpts = {},
  ): Promise<Page<RewardRedemption>> {
    const limit = opts.limit ?? 20;
    const cur = decodeCursor(opts.cursor);
    const rows = await db.query.rewardRedemptions.findMany({
      where: and(
        eq(schema.rewardRedemptions.shopId, shopId),
        eq(schema.rewardRedemptions.customerId, customerId),
        cursorWhere(
          schema.rewardRedemptions.createdAt,
          schema.rewardRedemptions.id,
          cur,
        ),
      ),
      orderBy: [
        desc(schema.rewardRedemptions.createdAt),
        desc(schema.rewardRedemptions.id),
      ],
      limit: limit + 1,
    });
    return toPage(rows.map(toRedemption), limit);
  }
}
