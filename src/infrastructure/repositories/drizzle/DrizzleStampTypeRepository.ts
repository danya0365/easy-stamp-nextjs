import "server-only";

import { and, asc, eq, count } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { StampType } from "@/src/domain/entities";
import type {
  CreateStampTypeInput,
  IStampTypeRepository,
  UpdateStampTypeInput,
} from "@/src/application/repositories/IStampTypeRepository";

type Row = typeof schema.stampTypes.$inferSelect;

function toStampType(r: Row): StampType {
  return {
    id: r.id,
    shopId: r.shopId,
    name: r.name,
    threshold: r.threshold,
    rewardText: r.rewardText,
    priceSatang: r.priceSatang,
    isActive: r.isActive,
    isDefault: r.isDefault,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class DrizzleStampTypeRepository implements IStampTypeRepository {
  async create(input: CreateStampTypeInput): Promise<StampType> {
    const [r] = await db
      .insert(schema.stampTypes)
      .values({
        shopId: input.shopId,
        name: input.name,
        threshold: input.threshold,
        rewardText: input.rewardText,
        priceSatang: input.priceSatang ?? null,
        isActive: input.isActive ?? true,
        isDefault: input.isDefault ?? false,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();
    return toStampType(r);
  }

  async findById(id: string): Promise<StampType | null> {
    const r = await db.query.stampTypes.findFirst({
      where: eq(schema.stampTypes.id, id),
    });
    return r ? toStampType(r) : null;
  }

  async listByShop(
    shopId: string,
    opts?: { activeOnly?: boolean },
  ): Promise<StampType[]> {
    const where = opts?.activeOnly
      ? and(
          eq(schema.stampTypes.shopId, shopId),
          eq(schema.stampTypes.isActive, true),
        )
      : eq(schema.stampTypes.shopId, shopId);
    const rows = await db.query.stampTypes.findMany({
      where,
      orderBy: [asc(schema.stampTypes.sortOrder), asc(schema.stampTypes.createdAt)],
    });
    return rows.map(toStampType);
  }

  async findDefault(shopId: string): Promise<StampType | null> {
    const r = await db.query.stampTypes.findFirst({
      where: and(
        eq(schema.stampTypes.shopId, shopId),
        eq(schema.stampTypes.isDefault, true),
      ),
    });
    return r ? toStampType(r) : null;
  }

  async countActive(shopId: string): Promise<number> {
    const [r] = await db
      .select({ value: count() })
      .from(schema.stampTypes)
      .where(
        and(
          eq(schema.stampTypes.shopId, shopId),
          eq(schema.stampTypes.isActive, true),
        ),
      );
    return r?.value ?? 0;
  }

  async update(id: string, input: UpdateStampTypeInput): Promise<StampType> {
    const [r] = await db
      .update(schema.stampTypes)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.threshold !== undefined ? { threshold: input.threshold } : {}),
        ...(input.rewardText !== undefined
          ? { rewardText: input.rewardText }
          : {}),
        ...(input.priceSatang !== undefined
          ? { priceSatang: input.priceSatang }
          : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.stampTypes.id, id))
      .returning();
    return toStampType(r);
  }

  async setActive(id: string, isActive: boolean): Promise<StampType> {
    const [r] = await db
      .update(schema.stampTypes)
      .set({ isActive, updatedAt: new Date().toISOString() })
      .where(eq(schema.stampTypes.id, id))
      .returning();
    return toStampType(r);
  }
}
