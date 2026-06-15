import type { PlatformAnalyticsView } from "@/src/domain/entities";
import type { IPlatformAnalyticsRepository } from "@/src/application/repositories/IPlatformAnalyticsRepository";
import {
  buildDailySeries,
  rangeToSince,
  redemptionRate,
  type RangeDays,
} from "@/src/domain/services/analytics";

/** Assembles the platform-admin (cross-shop) analytics view for a day range. */
export class GetPlatformAnalyticsUseCase {
  constructor(private readonly analytics: IPlatformAnalyticsRepository) {}

  async execute(
    rangeDays: RangeDays,
    now: Date = new Date(),
  ): Promise<PlatformAnalyticsView> {
    const sinceISO = rangeToSince(now, rangeDays);

    const [summary, dailyStamps, dailyRedemptions, byShop] = await Promise.all([
      this.analytics.summary(sinceISO),
      this.analytics.dailyStamps(sinceISO),
      this.analytics.dailyRedemptions(sinceISO),
      this.analytics.byShop(sinceISO),
    ]);

    return {
      rangeDays,
      summary,
      redemptionRate: redemptionRate(summary.redeemers, summary.activeCustomers),
      daily: buildDailySeries(
        sinceISO,
        now.toISOString(),
        dailyStamps,
        dailyRedemptions,
      ),
      byShop,
    };
  }
}
