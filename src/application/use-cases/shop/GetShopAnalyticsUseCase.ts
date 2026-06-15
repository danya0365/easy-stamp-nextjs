import type { ShopAnalyticsView } from "@/src/domain/entities";
import type { IAnalyticsRepository } from "@/src/application/repositories/IAnalyticsRepository";
import {
  buildDailySeries,
  rangeToSince,
  redemptionRate,
  type RangeDays,
} from "@/src/domain/services/analytics";

/** Assembles the shop analytics dashboard view for a given day range. */
export class GetShopAnalyticsUseCase {
  constructor(private readonly analytics: IAnalyticsRepository) {}

  async execute(
    shopId: string,
    rangeDays: RangeDays,
    now: Date = new Date(),
  ): Promise<ShopAnalyticsView> {
    const sinceISO = rangeToSince(now, rangeDays);

    const [summary, dailyStamps, dailyRedemptions, byType, byBranch, topCustomers] =
      await Promise.all([
        this.analytics.summary(shopId, sinceISO),
        this.analytics.dailyStamps(shopId, sinceISO),
        this.analytics.dailyRedemptions(shopId, sinceISO),
        this.analytics.byStampType(shopId, sinceISO),
        this.analytics.byBranch(shopId, sinceISO),
        this.analytics.topCustomers(shopId, sinceISO),
      ]);

    return {
      rangeDays,
      summary,
      redemptionRate: redemptionRate(summary.redeemers, summary.activeCustomers),
      daily: buildDailySeries(sinceISO, now.toISOString(), dailyStamps, dailyRedemptions),
      byType,
      byBranch,
      topCustomers,
    };
  }
}
