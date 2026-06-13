import type { CustomerCardView } from "@/src/domain/entities";
import { buildCardView } from "@/src/domain/services/card-view";
import { normalizePhone } from "@/src/domain/services/phone";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";

/** Look up a customer's card by shop + phone. Returns null if no such customer. */
export class GetCustomerCardUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly customers: ICustomerRepository,
    private readonly cards: IStampCardRepository,
  ) {}

  async execute(
    shopId: string,
    phone: string,
  ): Promise<CustomerCardView | null> {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;

    const shop = await this.shops.findById(shopId);
    if (!shop) return null;

    const customer = await this.customers.findByPhone(shopId, normalized);
    if (!customer) return null;

    const card =
      (await this.cards.findByCustomer(shopId, customer.id)) ??
      (await this.cards.findOrCreate(shopId, customer.id));

    return buildCardView(shop, customer, card);
  }
}
