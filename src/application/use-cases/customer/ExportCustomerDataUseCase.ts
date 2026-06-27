import type {
  RewardRedemption,
  ShopReview,
  StampTransaction,
} from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampTransactionRepository } from "@/src/application/repositories/IStampTransactionRepository";
import type { IRewardRedemptionRepository } from "@/src/application/repositories/IRewardRedemptionRepository";
import type { IShopReviewRepository } from "@/src/application/repositories/IShopReviewRepository";

export interface CustomerDataExport {
  exportedAt: string;
  shop: { id: string; name: string };
  customer: {
    id: string;
    phone: string;
    displayName: string | null;
    publicCode: string;
    createdAt: string;
  };
  stampBalances: Array<{
    stampType: string;
    currentStamps: number;
    lifetimeStamps: number;
    rewardsEarned: number;
  }>;
  transactions: StampTransaction[];
  redemptions: RewardRedemption[];
  review: ShopReview | null;
}

/**
 * PDPA data-access (export): aggregate everything a shop holds about ONE of its
 * customers into a portable object. Every read is scoped by `shopId`, so a shop
 * can only export its own customers (cross-tenant ids resolve to "not found").
 */
export class ExportCustomerDataUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly customers: ICustomerRepository,
    private readonly cards: IStampCardRepository,
    private readonly balances: IStampBalanceRepository,
    private readonly types: IStampTypeRepository,
    private readonly transactions: IStampTransactionRepository,
    private readonly redemptions: IRewardRedemptionRepository,
    private readonly reviews: IShopReviewRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    shopId: string,
    customerId: string,
  ): Promise<CustomerDataExport> {
    const shop = await this.shops.findById(shopId);
    if (!shop) throw new Error("ไม่พบร้านค้า");
    const customer = await this.customers.findById(shopId, customerId);
    if (!customer) throw new Error("ไม่พบลูกค้าในร้านนี้");

    const card = await this.cards.findByCustomer(shopId, customerId);
    const balances = card ? await this.balances.listByCard(card.id) : [];
    const types = await this.types.listByShop(shopId);
    const typeName = (id: string) =>
      types.find((t) => t.id === id)?.name ?? id;

    const [transactions, redemptions, review] = await Promise.all([
      this.transactions.listByCustomer(shopId, customerId),
      this.redemptions.listByCustomer(shopId, customerId),
      this.reviews.findByCustomer(shopId, customerId),
    ]);

    return {
      exportedAt: this.now().toISOString(),
      shop: { id: shop.id, name: shop.name },
      customer: {
        id: customer.id,
        phone: customer.phone,
        displayName: customer.displayName,
        publicCode: customer.publicCode,
        createdAt: customer.createdAt,
      },
      stampBalances: balances.map((b) => ({
        stampType: typeName(b.stampTypeId),
        currentStamps: b.currentStamps,
        lifetimeStamps: b.lifetimeStamps,
        rewardsEarned: b.rewardsEarned,
      })),
      transactions,
      redemptions,
      review,
    };
  }
}
