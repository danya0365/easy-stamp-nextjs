import { and, eq, gte, sql } from "drizzle-orm";

import { db, schema } from "@/src/infrastructure/db/client";
import type {
  PlatformAnalyticsSummary,
  AnalyticsShopRow,
  DailyBucket,
} from "@/src/domain/entities";
import type { IPlatformAnalyticsRepository } from "@/src/application/repositories/IPlatformAnalyticsRepository";

const tx = schema.stampTransactions;
const rr = schema.rewardRedemptions;

/** strftime expression bucketing a createdAt column into a Bangkok calendar day. */
function bangkokDayExpr(col: typeof tx.createdAt | typeof rr.createdAt) {
  return sql<string>`strftime('%Y-%m-%d', ${col}, '+7 hours')`;
}

async function scalar(query: Promise<{ v: number }[]>): Promise<number> {
  const [row] = await query;
  return row?.v ?? 0;
}

/**
 * Cross-shop analytics read-model. Mirrors DrizzleAnalyticsRepository but drops
 * the per-shop `shopId` filter — every query spans all shops, bounded only by
 * `sinceISO` on createdAt (covered by the new (createdAt) indexes).
 */
export class DrizzlePlatformAnalyticsRepository
  implements IPlatformAnalyticsRepository
{
  async summary(sinceISO: string): Promise<PlatformAnalyticsSummary> {
    const [
      stampsIssued,
      redemptions,
      activeCustomers,
      redeemers,
      newCustomers,
      totalCustomers,
      totalShops,
      activeShops,
    ] = await Promise.all([
      scalar(
        db
          .select({ v: sql<number>`coalesce(sum(${tx.quantity}), 0)` })
          .from(tx)
          .where(and(eq(tx.type, "earn"), gte(tx.createdAt, sinceISO))),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(*)` })
          .from(rr)
          .where(gte(rr.createdAt, sinceISO)),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(distinct ${tx.customerId})` })
          .from(tx)
          .where(and(eq(tx.type, "earn"), gte(tx.createdAt, sinceISO))),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(distinct ${rr.customerId})` })
          .from(rr)
          .where(gte(rr.createdAt, sinceISO)),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(*)` })
          .from(schema.customers)
          .where(gte(schema.customers.createdAt, sinceISO)),
      ),
      scalar(
        db.select({ v: sql<number>`count(*)` }).from(schema.customers),
      ),
      scalar(db.select({ v: sql<number>`count(*)` }).from(schema.shops)),
      scalar(
        db
          .select({ v: sql<number>`count(distinct ${tx.shopId})` })
          .from(tx)
          .where(and(eq(tx.type, "earn"), gte(tx.createdAt, sinceISO))),
      ),
    ]);

    return {
      stampsIssued,
      redemptions,
      activeCustomers,
      redeemers,
      newCustomers,
      totalCustomers,
      totalShops,
      activeShops,
    };
  }

  async dailyStamps(sinceISO: string): Promise<DailyBucket[]> {
    const day = bangkokDayExpr(tx.createdAt);
    const rows = await db
      .select({ day, value: sql<number>`coalesce(sum(${tx.quantity}), 0)` })
      .from(tx)
      .where(and(eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)))
      .groupBy(day);
    return rows.map((r) => ({ day: r.day, value: Number(r.value) }));
  }

  async dailyRedemptions(sinceISO: string): Promise<DailyBucket[]> {
    const day = bangkokDayExpr(rr.createdAt);
    const rows = await db
      .select({ day, value: sql<number>`count(*)` })
      .from(rr)
      .where(gte(rr.createdAt, sinceISO))
      .groupBy(day);
    return rows.map((r) => ({ day: r.day, value: Number(r.value) }));
  }

  async byShop(sinceISO: string, limit = 15): Promise<AnalyticsShopRow[]> {
    const [shops, stampRows, redeemRows] = await Promise.all([
      db.query.shops.findMany(),
      db
        .select({
          id: tx.shopId,
          value: sql<number>`coalesce(sum(${tx.quantity}), 0)`,
        })
        .from(tx)
        .where(and(eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)))
        .groupBy(tx.shopId),
      db
        .select({ id: rr.shopId, value: sql<number>`count(*)` })
        .from(rr)
        .where(gte(rr.createdAt, sinceISO))
        .groupBy(rr.shopId),
    ]);

    const nameById = new Map(shops.map((s) => [s.id, s.name]));
    const stampById = new Map(stampRows.map((r) => [r.id, Number(r.value)]));
    const redeemById = new Map(redeemRows.map((r) => [r.id, Number(r.value)]));

    const ids = new Set<string>([...stampById.keys(), ...redeemById.keys()]);
    return [...ids]
      .map((id) => ({
        shopId: id,
        name: nameById.get(id) || "ไม่ทราบร้าน",
        stamps: stampById.get(id) ?? 0,
        redemptions: redeemById.get(id) ?? 0,
      }))
      .sort((a, b) => b.stamps - a.stamps)
      .slice(0, limit);
  }
}
