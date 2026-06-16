import { eq, sql } from "drizzle-orm";

import { db, schema } from "@/src/infrastructure/db/client";
import type {
  IRateLimitRepository,
  RateLimitResult,
} from "@/src/application/repositories/IRateLimitRepository";

const t = schema.rateLimits;

/** DB-backed fixed-window rate limiter (works across serverless instances). */
export class DrizzleRateLimitRepository implements IRateLimitRepository {
  async hit(
    key: string,
    limit: number,
    windowMs: number,
    now: number = Date.now(),
  ): Promise<RateLimitResult> {
    const row = await db.query.rateLimits.findFirst({ where: eq(t.key, key) });

    // Fresh window (no row, or the previous window has elapsed).
    if (!row || new Date(row.resetAt).getTime() <= now) {
      const resetAt = new Date(now + windowMs).toISOString();
      await db
        .insert(t)
        .values({ key, count: 1, resetAt })
        .onConflictDoUpdate({ target: t.key, set: { count: 1, resetAt } });
      return { allowed: true, retryAfterSec: 0 };
    }

    if (row.count >= limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((new Date(row.resetAt).getTime() - now) / 1000),
      );
      return { allowed: false, retryAfterSec };
    }

    await db
      .update(t)
      .set({ count: sql`${t.count} + 1` })
      .where(eq(t.key, key));
    return { allowed: true, retryAfterSec: 0 };
  }
}
