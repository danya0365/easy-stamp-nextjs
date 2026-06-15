import type { CustomerCardView } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerDeviceRepository } from "@/src/application/repositories/ICustomerDeviceRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";
import { loadCardView } from "@/src/application/use-cases/stamp/loadCardView";

/** Resolve a bound device's token → the customer's card (shop-scoped). */
export class GetCardByDeviceTokenUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly devices: ICustomerDeviceRepository,
    private readonly cards: IStampCardRepository,
    private readonly stampTypes: IStampTypeRepository,
    private readonly balances: IStampBalanceRepository,
  ) {}

  async execute(
    shopId: string,
    token: string,
  ): Promise<CustomerCardView | null> {
    if (!token) return null;
    const found = await this.devices.findByToken(token);
    if (!found || found.customer.shopId !== shopId) return null;

    const shop = await this.shops.findById(shopId);
    if (!shop) return null;

    return loadCardView(
      { stampTypes: this.stampTypes, cards: this.cards, balances: this.balances },
      shopId,
      found.customer,
    );
  }
}
