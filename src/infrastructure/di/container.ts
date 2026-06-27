import "server-only";

import { GenericContainer } from "@/src/infrastructure/di/container.generic";

import { DrizzleShopRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopRepository";
import { DrizzleShopCategoryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopCategoryRepository";
import { DrizzleBranchRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBranchRepository";
import { DrizzleCustomerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleCustomerRepository";
import { DrizzleCustomerDeviceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleCustomerDeviceRepository";
import { DrizzleBindCodeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBindCodeRepository";
import { DrizzleStampCardRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampCardRepository";
import { DrizzleStampTypeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampTypeRepository";
import { DrizzleStampBalanceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampBalanceRepository";
import { DrizzleStampTransactionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampTransactionRepository";
import { DrizzleRewardRedemptionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleRewardRedemptionRepository";
import { DrizzleAnalyticsRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAnalyticsRepository";
import { DrizzlePlatformAnalyticsRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePlatformAnalyticsRepository";
import { DrizzleLeadRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleLeadRepository";
import { DrizzleLeadVisitLogRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleLeadVisitLogRepository";
import { DrizzleShopImageRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopImageRepository";
import { DrizzleShopReviewRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopReviewRepository";
import { DrizzleShopProfileRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopProfileRepository";

import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IShopCategoryRepository } from "@/src/application/repositories/IShopCategoryRepository";
import type { IBranchRepository } from "@/src/application/repositories/IBranchRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { ICustomerDeviceRepository } from "@/src/application/repositories/ICustomerDeviceRepository";
import type { IBindCodeRepository } from "@/src/application/repositories/IBindCodeRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";
import type { IStampTransactionRepository } from "@/src/application/repositories/IStampTransactionRepository";
import type { IRewardRedemptionRepository } from "@/src/application/repositories/IRewardRedemptionRepository";
import type { IAnalyticsRepository } from "@/src/application/repositories/IAnalyticsRepository";
import type { IPlatformAnalyticsRepository } from "@/src/application/repositories/IPlatformAnalyticsRepository";
import type { ILeadRepository } from "@/src/application/repositories/ILeadRepository";
import type { ILeadVisitLogRepository } from "@/src/application/repositories/ILeadVisitLogRepository";
import type { IShopImageRepository } from "@/src/application/repositories/IShopImageRepository";
import type { IShopReviewRepository } from "@/src/application/repositories/IShopReviewRepository";
import type { IShopProfileRepository } from "@/src/application/repositories/IShopProfileRepository";

/**
 * Server-side composition root. The 🟢 generic core (account/auth, billing,
 * notifications, audit, rate-limit, payments, shared services) lives in
 * `GenericContainer` (container.generic.ts) — keep that as-is. This subclass
 * adds the 🔴 **domain** repositories (stamps / shops / customers / leads /
 * reviews). When forking into a new product, replace ONLY the fields below with
 * the new domain's repos and update the imports — see docs/FORKING.md.
 */
class Container extends GenericContainer {
  readonly shopRepository: IShopRepository = new DrizzleShopRepository();
  readonly shopCategoryRepository: IShopCategoryRepository =
    new DrizzleShopCategoryRepository();
  readonly branchRepository: IBranchRepository = new DrizzleBranchRepository();
  readonly customerRepository: ICustomerRepository =
    new DrizzleCustomerRepository();
  readonly customerDeviceRepository: ICustomerDeviceRepository =
    new DrizzleCustomerDeviceRepository();
  readonly bindCodeRepository: IBindCodeRepository =
    new DrizzleBindCodeRepository();
  readonly stampCardRepository: IStampCardRepository =
    new DrizzleStampCardRepository();
  readonly stampTypeRepository: IStampTypeRepository =
    new DrizzleStampTypeRepository();
  readonly stampBalanceRepository: IStampBalanceRepository =
    new DrizzleStampBalanceRepository();
  readonly stampTransactionRepository: IStampTransactionRepository =
    new DrizzleStampTransactionRepository();
  readonly rewardRedemptionRepository: IRewardRedemptionRepository =
    new DrizzleRewardRedemptionRepository();
  readonly analyticsRepository: IAnalyticsRepository =
    new DrizzleAnalyticsRepository();
  readonly platformAnalyticsRepository: IPlatformAnalyticsRepository =
    new DrizzlePlatformAnalyticsRepository();
  readonly leadRepository: ILeadRepository = new DrizzleLeadRepository();
  readonly leadVisitLogRepository: ILeadVisitLogRepository =
    new DrizzleLeadVisitLogRepository();
  readonly shopImageRepository: IShopImageRepository =
    new DrizzleShopImageRepository();
  readonly shopReviewRepository: IShopReviewRepository =
    new DrizzleShopReviewRepository();
  readonly shopProfileRepository: IShopProfileRepository =
    new DrizzleShopProfileRepository();
}

const globalForContainer = globalThis as unknown as {
  __esContainer?: Container;
};

export const container = globalForContainer.__esContainer ?? new Container();
if (process.env.NODE_ENV !== "production") {
  globalForContainer.__esContainer = container;
}
