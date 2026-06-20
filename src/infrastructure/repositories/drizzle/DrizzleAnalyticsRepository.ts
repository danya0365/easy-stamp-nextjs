import "server-only";

import { and, eq, gte, sql, desc } from "drizzle-orm";

import { db, schema } from "@/src/infrastructure/db/client";
import { formatPhone } from "@/src/domain/services/phone";
import type {
  AnalyticsSummary,
  AnalyticsTypeRow,
  AnalyticsBranchRow,
  AnalyticsTopCustomer,
  DailyBucket,
} from "@/src/domain/entities";
import type { IAnalyticsRepository } from "@/src/application/repositories/IAnalyticsRepository";

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

export class DrizzleAnalyticsRepository implements IAnalyticsRepository {
  async summary(shopId: string, sinceISO: string): Promise<AnalyticsSummary> {
    const [
      stampsIssued,
      redemptions,
      activeCustomers,
      redeemers,
      newCustomers,
      totalCustomers,
    ] = await Promise.all([
      scalar(
        db
          .select({ v: sql<number>`coalesce(sum(${tx.quantity}), 0)` })
          .from(tx)
          .where(
            and(eq(tx.shopId, shopId), eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)),
          ),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(*)` })
          .from(rr)
          .where(and(eq(rr.shopId, shopId), gte(rr.createdAt, sinceISO))),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(distinct ${tx.customerId})` })
          .from(tx)
          .where(
            and(eq(tx.shopId, shopId), eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)),
          ),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(distinct ${rr.customerId})` })
          .from(rr)
          .where(and(eq(rr.shopId, shopId), gte(rr.createdAt, sinceISO))),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(*)` })
          .from(schema.customers)
          .where(
            and(
              eq(schema.customers.shopId, shopId),
              gte(schema.customers.createdAt, sinceISO),
            ),
          ),
      ),
      scalar(
        db
          .select({ v: sql<number>`count(*)` })
          .from(schema.customers)
          .where(eq(schema.customers.shopId, shopId)),
      ),
    ]);

    return {
      stampsIssued,
      redemptions,
      activeCustomers,
      redeemers,
      newCustomers,
      totalCustomers,
    };
  }

  async dailyStamps(shopId: string, sinceISO: string): Promise<DailyBucket[]> {
    const day = bangkokDayExpr(tx.createdAt);
    const rows = await db
      .select({ day, value: sql<number>`coalesce(sum(${tx.quantity}), 0)` })
      .from(tx)
      .where(
        and(eq(tx.shopId, shopId), eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)),
      )
      .groupBy(day);
    return rows.map((r) => ({ day: r.day, value: Number(r.value) }));
  }

  async dailyRedemptions(shopId: string, sinceISO: string): Promise<DailyBucket[]> {
    const day = bangkokDayExpr(rr.createdAt);
    const rows = await db
      .select({ day, value: sql<number>`count(*)` })
      .from(rr)
      .where(and(eq(rr.shopId, shopId), gte(rr.createdAt, sinceISO)))
      .groupBy(day);
    return rows.map((r) => ({ day: r.day, value: Number(r.value) }));
  }

  async byStampType(shopId: string, sinceISO: string): Promise<AnalyticsTypeRow[]> {
    const [types, stampRows, redeemRows] = await Promise.all([
      db.query.stampTypes.findMany({
        where: eq(schema.stampTypes.shopId, shopId),
      }),
      db
        .select({
          id: tx.stampTypeId,
          value: sql<number>`coalesce(sum(${tx.quantity}), 0)`,
        })
        .from(tx)
        .where(
          and(eq(tx.shopId, shopId), eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)),
        )
        .groupBy(tx.stampTypeId),
      db
        .select({ id: rr.stampTypeId, value: sql<number>`count(*)` })
        .from(rr)
        .where(and(eq(rr.shopId, shopId), gte(rr.createdAt, sinceISO)))
        .groupBy(rr.stampTypeId),
    ]);

    const nameById = new Map(types.map((t) => [t.id, t.name]));
    const stampById = new Map(stampRows.map((r) => [r.id, Number(r.value)]));
    const redeemById = new Map(redeemRows.map((r) => [r.id, Number(r.value)]));

    const ids = new Set<string | null>([
      ...stampById.keys(),
      ...redeemById.keys(),
    ]);
    return [...ids]
      .map((id) => ({
        stampTypeId: id,
        name: (id && nameById.get(id)) || "อื่นๆ",
        stamps: stampById.get(id) ?? 0,
        redemptions: redeemById.get(id) ?? 0,
      }))
      .sort((a, b) => b.stamps - a.stamps);
  }

  async byBranch(shopId: string, sinceISO: string): Promise<AnalyticsBranchRow[]> {
    const [branches, stampRows, redeemRows] = await Promise.all([
      db.query.branches.findMany({
        where: eq(schema.branches.shopId, shopId),
      }),
      db
        .select({
          id: tx.branchId,
          value: sql<number>`coalesce(sum(${tx.quantity}), 0)`,
        })
        .from(tx)
        .where(
          and(eq(tx.shopId, shopId), eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)),
        )
        .groupBy(tx.branchId),
      db
        .select({ id: rr.branchId, value: sql<number>`count(*)` })
        .from(rr)
        .where(and(eq(rr.shopId, shopId), gte(rr.createdAt, sinceISO)))
        .groupBy(rr.branchId),
    ]);

    const nameById = new Map(branches.map((b) => [b.id, b.name]));
    const stampById = new Map(stampRows.map((r) => [r.id, Number(r.value)]));
    const redeemById = new Map(redeemRows.map((r) => [r.id, Number(r.value)]));

    const ids = new Set<string | null>([
      ...stampById.keys(),
      ...redeemById.keys(),
    ]);
    return [...ids]
      .map((id) => ({
        branchId: id,
        name: (id && nameById.get(id)) || "ไม่ระบุสาขา",
        stamps: stampById.get(id) ?? 0,
        redemptions: redeemById.get(id) ?? 0,
      }))
      .sort((a, b) => b.stamps - a.stamps);
  }

  async topCustomers(
    shopId: string,
    sinceISO: string,
    limit = 5,
  ): Promise<AnalyticsTopCustomer[]> {
    const totalExpr = sql<number>`coalesce(sum(${tx.quantity}), 0)`;
    const rows = await db
      .select({ id: tx.customerId, value: totalExpr })
      .from(tx)
      .where(
        and(eq(tx.shopId, shopId), eq(tx.type, "earn"), gte(tx.createdAt, sinceISO)),
      )
      .groupBy(tx.customerId)
      .orderBy(desc(totalExpr))
      .limit(limit);

    if (rows.length === 0) return [];

    const customers = await db.query.customers.findMany({
      where: eq(schema.customers.shopId, shopId),
    });
    const byId = new Map(customers.map((c) => [c.id, c]));
    return rows.map((r) => {
      const c = byId.get(r.id);
      const label = c
        ? c.displayName || formatPhone(c.phone)
        : "ลูกค้า";
      return { customerId: r.id, label, stamps: Number(r.value) };
    });
  }
}
