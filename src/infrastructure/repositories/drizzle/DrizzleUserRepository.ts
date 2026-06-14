import { eq } from "drizzle-orm";
import { db, schema } from "@/src/infrastructure/db/client";
import type { User, UserWithSecret } from "@/src/domain/entities";
import type {
  CreateUserInput,
  IUserRepository,
} from "@/src/application/repositories/IUserRepository";

type Row = typeof schema.users.$inferSelect;

function toUser(row: Row): User {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    shopId: row.shopId,
    branchId: row.branchId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleUserRepository implements IUserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const [row] = await db
      .insert(schema.users)
      .values({
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        shopId: input.shopId ?? null,
        branchId: input.branchId ?? null,
      })
      .returning();
    return toUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    return row ? toUser(row) : null;
  }

  async findByEmailWithSecret(email: string): Promise<UserWithSecret | null> {
    const row = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    return row ? { ...toUser(row), passwordHash: row.passwordHash } : null;
  }

  async findByIdWithSecret(id: string): Promise<UserWithSecret | null> {
    const row = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    return row ? { ...toUser(row), passwordHash: row.passwordHash } : null;
  }

  async listByShop(shopId: string): Promise<User[]> {
    const rows = await db.query.users.findMany({
      where: eq(schema.users.shopId, shopId),
    });
    return rows.map(toUser);
  }

  async setActive(id: string, isActive: boolean): Promise<User> {
    const [row] = await db
      .update(schema.users)
      .set({ isActive })
      .where(eq(schema.users.id, id))
      .returning();
    return toUser(row);
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    const [row] = await db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.id, id))
      .returning();
    return toUser(row);
  }
}
