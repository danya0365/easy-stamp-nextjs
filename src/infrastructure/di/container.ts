import "server-only";

import { DrizzleShopRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopRepository";
import { DrizzleShopCategoryRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopCategoryRepository";
import { DrizzleBranchRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBranchRepository";
import { DrizzleUserRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleUserRepository";
import { DrizzleSessionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSessionRepository";
import { DrizzleCustomerRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleCustomerRepository";
import { DrizzleCustomerDeviceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleCustomerDeviceRepository";
import { DrizzleBindCodeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleBindCodeRepository";
import { DrizzleStampCardRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampCardRepository";
import { DrizzleStampTransactionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampTransactionRepository";
import { DrizzleRewardRedemptionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleRewardRedemptionRepository";
import { DrizzleSubscriptionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSubscriptionRepository";
import { DrizzlePaymentRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePaymentRepository";
import { DrizzleTopupTransactionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleTopupTransactionRepository";

import { BcryptPasswordHasher } from "@/src/infrastructure/services/BcryptPasswordHasher";
import { ManualSlipPaymentVerifier } from "@/src/infrastructure/services/ManualSlipPaymentVerifier";
import { LocalSlipStorage } from "@/src/infrastructure/services/LocalSlipStorage";
import {
  R2SlipStorage,
  r2ConfigFromEnv,
} from "@/src/infrastructure/services/R2SlipStorage";

import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IShopCategoryRepository } from "@/src/application/repositories/IShopCategoryRepository";
import type { IBranchRepository } from "@/src/application/repositories/IBranchRepository";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { ISessionRepository } from "@/src/application/repositories/ISessionRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { ICustomerDeviceRepository } from "@/src/application/repositories/ICustomerDeviceRepository";
import type { IBindCodeRepository } from "@/src/application/repositories/IBindCodeRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTransactionRepository } from "@/src/application/repositories/IStampTransactionRepository";
import type { IRewardRedemptionRepository } from "@/src/application/repositories/IRewardRedemptionRepository";
import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { ITopupTransactionRepository } from "@/src/application/repositories/ITopupTransactionRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";
import type { IPaymentVerifier } from "@/src/application/services/IPaymentVerifier";
import type { ISlipStorage } from "@/src/application/services/ISlipStorage";

/** R2 in any environment that configures it (prod/Vercel); local disk otherwise. */
function createSlipStorage(): ISlipStorage {
  const r2 = r2ConfigFromEnv();
  return r2 ? new R2SlipStorage(r2) : new LocalSlipStorage();
}

/**
 * Server-side composition root: singleton repositories + services with their
 * concrete (Drizzle/local) implementations wired. Swap an implementation here
 * (e.g. an auto-verify PaymentVerifier) without touching use cases.
 */
class Container {
  readonly shopRepository: IShopRepository = new DrizzleShopRepository();
  readonly shopCategoryRepository: IShopCategoryRepository =
    new DrizzleShopCategoryRepository();
  readonly branchRepository: IBranchRepository = new DrizzleBranchRepository();
  readonly userRepository: IUserRepository = new DrizzleUserRepository();
  readonly sessionRepository: ISessionRepository =
    new DrizzleSessionRepository();
  readonly customerRepository: ICustomerRepository =
    new DrizzleCustomerRepository();
  readonly customerDeviceRepository: ICustomerDeviceRepository =
    new DrizzleCustomerDeviceRepository();
  readonly bindCodeRepository: IBindCodeRepository =
    new DrizzleBindCodeRepository();
  readonly stampCardRepository: IStampCardRepository =
    new DrizzleStampCardRepository();
  readonly stampTransactionRepository: IStampTransactionRepository =
    new DrizzleStampTransactionRepository();
  readonly rewardRedemptionRepository: IRewardRedemptionRepository =
    new DrizzleRewardRedemptionRepository();
  readonly subscriptionRepository: ISubscriptionRepository =
    new DrizzleSubscriptionRepository();
  readonly paymentRepository: IPaymentRepository =
    new DrizzlePaymentRepository();
  readonly topupTransactionRepository: ITopupTransactionRepository =
    new DrizzleTopupTransactionRepository();

  readonly passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
  readonly paymentVerifier: IPaymentVerifier = new ManualSlipPaymentVerifier();
  readonly slipStorage: ISlipStorage = createSlipStorage();
}

const globalForContainer = globalThis as unknown as {
  __esContainer?: Container;
};

export const container = globalForContainer.__esContainer ?? new Container();
if (process.env.NODE_ENV !== "production") {
  globalForContainer.__esContainer = container;
}
