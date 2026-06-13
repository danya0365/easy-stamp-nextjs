import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { Shop } from "@/src/domain/entities";
import type {
  CreateShopInput,
  IShopRepository,
  UpdateShopSettingsInput,
} from "@/src/application/repositories/IShopRepository";
import type { ShopStatus } from "@/src/domain/entities";

type Row = typeof schema.shops.$inferSelect;

function toShop(r: Row): Shop {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    status: r.status,
    categoryId: r.categoryId,
    stampThreshold: r.stampThreshold,
    rewardText: r.rewardText,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class DrizzleShopRepository implements IShopRepository {
  async create(input: CreateShopInput): Promise<Shop> {
    const [r] = await db
      .insert(schema.shops)
      .values({
        name: input.name,
        slug: input.slug,
        categoryId: input.categoryId ?? null,
        stampThreshold: input.stampThreshold ?? 10,
        rewardText: input.rewardText ?? "",
      })
      .returning();
    return toShop(r);
  }

  async findById(id: string): Promise<Shop | null> {
    const r = await db.query.shops.findFirst({ where: eq(schema.shops.id, id) });
    return r ? toShop(r) : null;
  }

  async findBySlug(slug: string): Promise<Shop | null> {
    const r = await db.query.shops.findFirst({
      where: eq(schema.shops.slug, slug),
    });
    return r ? toShop(r) : null;
  }

  async list(): Promise<Shop[]> {
    const rows = await db.query.shops.findMany({
      orderBy: asc(schema.shops.createdAt),
    });
    return rows.map(toShop);
  }

  async updateSettings(
    id: string,
    input: UpdateShopSettingsInput,
  ): Promise<Shop> {
    const [r] = await db
      .update(schema.shops)
      .set({
        ...(input.stampThreshold !== undefined
          ? { stampThreshold: input.stampThreshold }
          : {}),
        ...(input.rewardText !== undefined
          ? { rewardText: input.rewardText }
          : {}),
      })
      .where(eq(schema.shops.id, id))
      .returning();
    return toShop(r);
  }

  async setStatus(id: string, status: ShopStatus): Promise<Shop> {
    const [r] = await db
      .update(schema.shops)
      .set({ status })
      .where(eq(schema.shops.id, id))
      .returning();
    return toShop(r);
  }
}
