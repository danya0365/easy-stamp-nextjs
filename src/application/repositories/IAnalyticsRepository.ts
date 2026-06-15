import type {
  AnalyticsSummary,
  AnalyticsTypeRow,
  AnalyticsBranchRow,
  AnalyticsTopCustomer,
  DailyBucket,
} from "@/src/domain/entities";

/**
 * Read-model for the shop analytics dashboard. All methods are scoped to one
 * shop and (except totals) a `sinceISO` lower bound on `createdAt`. Day buckets
 * are Bangkok calendar days.
 */
export interface IAnalyticsRepository {
  summary(shopId: string, sinceISO: string): Promise<AnalyticsSummary>;
  dailyStamps(shopId: string, sinceISO: string): Promise<DailyBucket[]>;
  dailyRedemptions(shopId: string, sinceISO: string): Promise<DailyBucket[]>;
  byStampType(shopId: string, sinceISO: string): Promise<AnalyticsTypeRow[]>;
  byBranch(shopId: string, sinceISO: string): Promise<AnalyticsBranchRow[]>;
  topCustomers(
    shopId: string,
    sinceISO: string,
    limit?: number,
  ): Promise<AnalyticsTopCustomer[]>;
}
