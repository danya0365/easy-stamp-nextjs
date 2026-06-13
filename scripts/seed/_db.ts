import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "../../src/infrastructure/db/schema";

export type SeedDb = LibSQLDatabase<typeof schema>;

export interface SeedContext {
  db: SeedDb;
  /** Pre-computed bcrypt hash of DEFAULT_PASSWORD (shared across seed users). */
  passwordHash: string;
  log: (msg: string) => void;
}

export const DEFAULT_PASSWORD = "password123";
export const MONTHLY_AMOUNT_SATANG = 29900; // 299.00 THB / month

export function createSeedDb(): { db: SeedDb; client: Client } {
  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema, casing: "snake_case" });
  return { db, client };
}

export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export { schema };
