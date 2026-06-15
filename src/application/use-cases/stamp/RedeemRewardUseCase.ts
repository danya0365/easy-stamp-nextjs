import type { CustomerCardView } from "@/src/domain/entities";
import { normalizePhone } from "@/src/domain/services/phone";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";
import type { IStampTransactionRepository } from "@/src/application/repositories/IStampTransactionRepository";
import type { IRewardRedemptionRepository } from "@/src/application/repositories/IRewardRedemptionRepository";
import { loadCardView } from "./loadCardView";

export interface RedeemRewardInput {
  shopId: string;
  branchId?: string | null;
  phone: string;
  stampTypeId: string;
  performedBy: string;
}

/** Redeem one reward of a given stamp type when its balance has reached the type's threshold. */
export class RedeemRewardUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly customers: ICustomerRepository,
    private readonly cards: IStampCardRepository,
    private readonly stampTypes: IStampTypeRepository,
    private readonly balances: IStampBalanceRepository,
    private readonly transactions: IStampTransactionRepository,
    private readonly redemptions: IRewardRedemptionRepository,
  ) {}

  async execute(input: RedeemRewardInput): Promise<CustomerCardView> {
    const phone = normalizePhone(input.phone);
    const shop = await this.shops.findById(input.shopId);
    if (!shop) throw new Error("ไม่พบร้านค้า");

    const customer = await this.customers.findByPhone(input.shopId, phone);
    if (!customer) throw new Error("ไม่พบลูกค้า");

    const type = await this.stampTypes.findById(input.stampTypeId);
    if (!type || type.shopId !== input.shopId) {
      throw new Error("ไม่พบประเภทแสตมป์");
    }

    const card = await this.cards.findByCustomer(input.shopId, customer.id);
    if (!card) throw new Error("ลูกค้ายังไม่มีแสตมป์");

    const balance = await this.balances.findByCardAndType(card.id, type.id);
    const current = balance?.currentStamps ?? 0;
    if (!balance || current < type.threshold) {
      throw new Error(
        `แสตมป์ "${type.name}" ยังไม่ครบ (${current}/${type.threshold}) ยังแลกไม่ได้`,
      );
    }

    await this.redemptions.create({
      shopId: input.shopId,
      branchId: input.branchId ?? null,
      customerId: customer.id,
      cardId: card.id,
      stampTypeId: type.id,
      rewardTextSnapshot: type.rewardText,
      stampsSpent: type.threshold,
      performedBy: input.performedBy,
    });

    await this.balances.applyRedemption(balance.id, type.threshold);

    await this.transactions.create({
      shopId: input.shopId,
      branchId: input.branchId ?? null,
      customerId: customer.id,
      cardId: card.id,
      stampTypeId: type.id,
      type: "redeem_adjust",
      quantity: -type.threshold,
      performedBy: input.performedBy,
      note: `แลกรางวัล: ${type.name}`,
    });

    return loadCardView(
      {
        stampTypes: this.stampTypes,
        cards: this.cards,
        balances: this.balances,
      },
      input.shopId,
      customer,
    );
  }
}
