import type { CustomerCardView } from "@/src/domain/entities";
import { buildCardView } from "@/src/domain/services/card-view";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";

/** Resolve a customer's card from their QR code (opaque publicCode), shop-scoped. */
export class GetCardByPublicCodeUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly customers: ICustomerRepository,
    private readonly cards: IStampCardRepository,
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

    const card = await this.cards.findOrCreate(shopId, customer.id);
    return buildCardView(shop, customer, card);
  }
}
