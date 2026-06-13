import type { CustomerCardView } from "@/src/domain/entities";
import { buildCardView } from "@/src/domain/services/card-view";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerDeviceRepository } from "@/src/application/repositories/ICustomerDeviceRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";

/** Resolve a bound device's token → the customer's card (shop-scoped). */
export class GetCardByDeviceTokenUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly devices: ICustomerDeviceRepository,
    private readonly cards: IStampCardRepository,
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

    const card = await this.cards.findOrCreate(shopId, found.customer.id);
    return buildCardView(shop, found.customer, card);
  }
}
