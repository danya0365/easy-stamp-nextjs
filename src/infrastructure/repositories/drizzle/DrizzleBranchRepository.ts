import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { Branch } from "@/src/domain/entities";
import type {
  CreateBranchInput,
  IBranchRepository,
} from "@/src/application/repositories/IBranchRepository";

type Row = typeof schema.branches.$inferSelect;

function toBranch(r: Row): Branch {
  return {
    id: r.id,
    shopId: r.shopId,
    name: r.name,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class DrizzleBranchRepository implements IBranchRepository {
  async create(input: CreateBranchInput): Promise<Branch> {
    const [r] = await db
      .insert(schema.branches)
      .values({ shopId: input.shopId, name: input.name })
      .returning();
    return toBranch(r);
  }

  async findById(id: string): Promise<Branch | null> {
    const r = await db.query.branches.findFirst({
      where: eq(schema.branches.id, id),
    });
    return r ? toBranch(r) : null;
  }

  async listByShop(shopId: string): Promise<Branch[]> {
    const rows = await db.query.branches.findMany({
      where: eq(schema.branches.shopId, shopId),
      orderBy: asc(schema.branches.createdAt),
    });
    return rows.map(toBranch);
  }

  async setActive(id: string, isActive: boolean): Promise<Branch> {
    const [r] = await db
      .update(schema.branches)
      .set({ isActive })
      .where(eq(schema.branches.id, id))
      .returning();
    return toBranch(r);
  }
}
