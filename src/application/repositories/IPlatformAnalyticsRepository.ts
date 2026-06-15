import type {
  PlatformAnalyticsSummary,
  AnalyticsShopRow,
  DailyBucket,
} from "@/src/domain/entities";

/**
 * Read-model for the platform-admin (cross-shop) analytics dashboard. Unlike
 * IAnalyticsRepository these methods span ALL shops; they only bound on a
 * `sinceISO` lower bound on `createdAt` (except all-time totals). Day buckets
 * are Bangkok calendar days.
 */
export interface IPlatformAnalyticsRepository {
  summary(sinceISO: string): Promise<PlatformAnalyticsSummary>;
  dailyStamps(sinceISO: string): Promise<DailyBucket[]>;
  dailyRedemptions(sinceISO: string): Promise<DailyBucket[]>;
  /** Per-shop leaderboard, sorted by stamps issued desc. */
  byShop(sinceISO: string, limit?: number): Promise<AnalyticsShopRow[]>;
}
