import type { CustomerCardView } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";
import { loadCardView } from "./loadCardView";

/** Resolve a customer's card from their QR code (opaque publicCode), shop-scoped. */
export class GetCardByPublicCodeUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly customers: ICustomerRepository,
    private readonly cards: IStampCardRepository,
    private readonly stampTypes: IStampTypeRepository,
    private readonly balances: IStampBalanceRepository,
  ) {}

  async execute(
    shopId: string,
    code: string,
  ): Promise<CustomerCardView | null> {
    const trimmed = code.trim();
    if (!trimmed) return null;

    const shop = await this.shops.findById(shopId);
    if (!shop) return null;

    const customer = await this.customers.findByPublicCode(shopId, trimmed);
    if (!customer) return null;

    return loadCardView(
      { stampTypes: this.stampTypes, cards: this.cards, balances: this.balances },
      shopId,
      customer,
    );
  }
}
