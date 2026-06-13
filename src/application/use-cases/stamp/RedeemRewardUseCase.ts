import type { CustomerCardView } from "@/src/domain/entities";
import { buildCardView } from "@/src/domain/services/card-view";
import { normalizePhone } from "@/src/domain/services/phone";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTransactionRepository } from "@/src/application/repositories/IStampTransactionRepository";
import type { IRewardRedemptionRepository } from "@/src/application/repositories/IRewardRedemptionRepository";

export interface RedeemRewardInput {
  shopId: string;
  branchId?: string | null;
  phone: string;
  performedBy: string;
}

/** Redeem one reward when a card has reached the shop threshold. */
export class RedeemRewardUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly customers: ICustomerRepository,
    private readonly cards: IStampCardRepository,
    private readonly transactions: IStampTransactionRepository,
    private readonly redemptions: IRewardRedemptionRepository,
  ) {}

  async execute(input: RedeemRewardInput): Promise<CustomerCardView> {
    const phone = normalizePhone(input.phone);
    const shop = await this.shops.findById(input.shopId);
    if (!shop) throw new Error("ไม่พบร้านค้า");

    const customer = await this.customers.findByPhone(input.shopId, phone);
    if (!customer) throw new Error("ไม่พบลูกค้า");

    const card = await this.cards.findByCustomer(input.shopId, customer.id);
    if (!card) throw new Error("ลูกค้ายังไม่มีแสตมป์");

    const threshold = shop.stampThreshold;
    if (card.currentStamps < threshold) {
      throw new Error(
        `แสตมป์ยังไม่ครบ (${card.currentStamps}/${threshold}) ยังแลกไม่ได้`,
      );
    }

    await this.redemptions.create({
      shopId: input.shopId,
      branchId: input.branchId ?? null,
      customerId: customer.id,
      cardId: card.id,
      rewardTextSnapshot: shop.rewardText,
      stampsSpent: threshold,
      performedBy: input.performedBy,
    });

    const updated = await this.cards.applyRedemption(card.id, threshold);

    await this.transactions.create({
      shopId: input.shopId,
      branchId: input.branchId ?? null,
      customerId: customer.id,
      cardId: card.id,
      type: "redeem_adjust",
      quantity: -threshold,
      performedBy: input.performedBy,
      note: "แลกรางวัล",
    });

    return buildCardView(shop, customer, updated);
  }
}
