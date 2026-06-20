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
import { DrizzleStampTypeRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampTypeRepository";
import { DrizzleStampBalanceRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampBalanceRepository";
import { DrizzleStampTransactionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleStampTransactionRepository";
import { DrizzleRewardRedemptionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleRewardRedemptionRepository";
import { DrizzleSubscriptionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleSubscriptionRepository";
import { DrizzlePaymentRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePaymentRepository";
import { DrizzleTopupTransactionRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleTopupTransactionRepository";
import { DrizzleNotificationRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleNotificationRepository";
import { DrizzleContactRequestRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleContactRequestRepository";
import { DrizzleAnalyticsRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAnalyticsRepository";
import { DrizzlePlatformAnalyticsRepository } from "@/src/infrastructure/repositories/drizzle/DrizzlePlatformAnalyticsRepository";
import { DrizzleRateLimitRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleRateLimitRepository";
import { DrizzleLeadRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleLeadRepository";
import { DrizzleLeadVisitLogRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleLeadVisitLogRepository";
import { DrizzleShopImageRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopImageRepository";
import { DrizzleShopReviewRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopReviewRepository";
import { DrizzleShopProfileRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleShopProfileRepository";
import { DrizzleAuditLogRepository } from "@/src/infrastructure/repositories/drizzle/DrizzleAuditLogRepository";

import { BcryptPasswordHasher } from "@/src/infrastructure/services/BcryptPasswordHasher";
import { CryptoTotpService } from "@/src/infrastructure/services/CryptoTotpService";
import {
  TurnstileVerifier,
  turnstileConfigFromEnv,
} from "@/src/infrastructure/services/TurnstileVerifier";
import { isProd } from "@/src/infrastructure/config/env";
import { ManualSlipPaymentVerifier } from "@/src/infrastructure/services/ManualSlipPaymentVerifier";
import { LocalSlipStorage } from "@/src/infrastructure/services/LocalSlipStorage";
import {
  R2SlipStorage,
  r2ConfigFromEnv,
} from "@/src/infrastructure/services/R2SlipStorage";
import {
  LineMessagingPusher,
  NullMessagePusher,
  lineConfigFromEnv,
} from "@/src/infrastructure/services/LineMessagingPusher";
import { createGeocoder } from "@/src/infrastructure/services/OsmGeocoder";
import { NotificationService } from "@/src/application/services/NotificationService";
import { AuditLogger } from "@/src/application/services/AuditLogger";
import { LoginSecurityService } from "@/src/application/services/LoginSecurityService";
import { SensitiveActionGuard } from "@/src/application/services/SensitiveActionGuard";

import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { IShopCategoryRepository } from "@/src/application/repositories/IShopCategoryRepository";
import type { IBranchRepository } from "@/src/application/repositories/IBranchRepository";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { ISessionRepository } from "@/src/application/repositories/ISessionRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { ICustomerDeviceRepository } from "@/src/application/repositories/ICustomerDeviceRepository";
import type { IBindCodeRepository } from "@/src/application/repositories/IBindCodeRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";
import type { IStampTransactionRepository } from "@/src/application/repositories/IStampTransactionRepository";
import type { IRewardRedemptionRepository } from "@/src/application/repositories/IRewardRedemptionRepository";
import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { ITopupTransactionRepository } from "@/src/application/repositories/ITopupTransactionRepository";
import type { INotificationRepository } from "@/src/application/repositories/INotificationRepository";
import type { IContactRequestRepository } from "@/src/application/repositories/IContactRequestRepository";
import type { IAnalyticsRepository } from "@/src/application/repositories/IAnalyticsRepository";
import type { IPlatformAnalyticsRepository } from "@/src/application/repositories/IPlatformAnalyticsRepository";
import type { IRateLimitRepository } from "@/src/application/repositories/IRateLimitRepository";
import type { ILeadRepository } from "@/src/application/repositories/ILeadRepository";
import type { ILeadVisitLogRepository } from "@/src/application/repositories/ILeadVisitLogRepository";
import type { IShopImageRepository } from "@/src/application/repositories/IShopImageRepository";
import type { IShopReviewRepository } from "@/src/application/repositories/IShopReviewRepository";
import type { IShopProfileRepository } from "@/src/application/repositories/IShopProfileRepository";
import type { IAuditLogRepository } from "@/src/application/repositories/IAuditLogRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";
import type { ITotpService } from "@/src/application/services/ITotpService";
import type { IPaymentVerifier } from "@/src/application/services/IPaymentVerifier";
import type { ISlipStorage } from "@/src/application/services/ISlipStorage";
import type { IMessagePusher } from "@/src/application/services/IMessagePusher";
import type { IGeocoder } from "@/src/application/services/IGeocoder";

/** R2 in any environment that configures it (prod/Vercel); local disk otherwise. */
function createSlipStorage(): ISlipStorage {
  const r2 = r2ConfigFromEnv();
  return r2 ? new R2SlipStorage(r2) : new LocalSlipStorage();
}

/** LINE pusher when credentials are configured; a no-op pusher otherwise. */
function createMessagePusher(): IMessagePusher {
  const line = lineConfigFromEnv();
  return line ? new LineMessagingPusher(line) : new NullMessagePusher();
}

/**
 * Turnstile CAPTCHA. Fail-open when unconfigured (honeypot + rate-limit still
 * guard the public form) — but warn once in production so a missing key isn't
 * silent.
 */
function createTurnstile(): TurnstileVerifier {
  const cfg = turnstileConfigFromEnv();
  if (!cfg && isProd) {
    console.warn(
      "[turnstile] NOT configured in production — the public contact form has no CAPTCHA (honeypot + rate-limit only). Set NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY to enable it.",
    );
  }
  return new TurnstileVerifier(cfg);
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
  readonly stampTypeRepository: IStampTypeRepository =
    new DrizzleStampTypeRepository();
  readonly stampBalanceRepository: IStampBalanceRepository =
    new DrizzleStampBalanceRepository();
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
  readonly notificationRepository: INotificationRepository =
    new DrizzleNotificationRepository();
  readonly contactRequestRepository: IContactRequestRepository =
    new DrizzleContactRequestRepository();
  readonly analyticsRepository: IAnalyticsRepository =
    new DrizzleAnalyticsRepository();
  readonly platformAnalyticsRepository: IPlatformAnalyticsRepository =
    new DrizzlePlatformAnalyticsRepository();
  readonly rateLimitRepository: IRateLimitRepository =
    new DrizzleRateLimitRepository();
  readonly leadRepository: ILeadRepository = new DrizzleLeadRepository();
  readonly leadVisitLogRepository: ILeadVisitLogRepository =
    new DrizzleLeadVisitLogRepository();
  readonly shopImageRepository: IShopImageRepository =
    new DrizzleShopImageRepository();
  readonly shopReviewRepository: IShopReviewRepository =
    new DrizzleShopReviewRepository();
  readonly shopProfileRepository: IShopProfileRepository =
    new DrizzleShopProfileRepository();
  readonly auditLogRepository: IAuditLogRepository =
    new DrizzleAuditLogRepository();

  readonly passwordHasher: IPasswordHasher = new BcryptPasswordHasher();
  readonly totp: ITotpService = new CryptoTotpService();
  readonly paymentVerifier: IPaymentVerifier = new ManualSlipPaymentVerifier();
  readonly slipStorage: ISlipStorage = createSlipStorage();
  readonly messagePusher: IMessagePusher = createMessagePusher();
  readonly turnstile: TurnstileVerifier = createTurnstile();
  readonly geocoder: IGeocoder = createGeocoder();

  readonly notificationService: NotificationService = new NotificationService(
    this.notificationRepository,
    this.userRepository,
    this.messagePusher,
  );
  readonly auditLogger: AuditLogger = new AuditLogger(this.auditLogRepository);
  readonly loginSecurity: LoginSecurityService = new LoginSecurityService(
    this.userRepository,
    this.auditLogRepository,
    this.auditLogger,
    this.notificationService,
  );
  readonly sensitiveActionGuard: SensitiveActionGuard = new SensitiveActionGuard(
    this.rateLimitRepository,
    this.auditLogger,
    this.notificationService,
  );
}

const globalForContainer = globalThis as unknown as {
  __esContainer?: Container;
};

export const container = globalForContainer.__esContainer ?? new Container();
if (process.env.NODE_ENV !== "production") {
  globalForContainer.__esContainer = container;
}
