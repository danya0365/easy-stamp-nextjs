import type { CustomerCardView } from "@/src/domain/entities";
import type { IShopRepository } from "@/src/application/repositories/IShopRepository";
import type { ICustomerDeviceRepository } from "@/src/application/repositories/ICustomerDeviceRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";
import { loadCardView } from "@/src/application/use-cases/stamp/loadCardView";

export interface BoundCard {
  shopName: string;
  slug: string;
  view: CustomerCardView;
}

/** Resolve every device token on this device into its shop card (deduped by shop). */
export class GetBoundCardsUseCase {
  constructor(
    private readonly shops: IShopRepository,
    private readonly devices: ICustomerDeviceRepository,
    private readonly cards: IStampCardRepository,
    private readonly stampTypes: IStampTypeRepository,
    private readonly balances: IStampBalanceRepository,
  ) {}

  async execute(tokens: string[]): Promise<BoundCard[]> {
    const out: BoundCard[] = [];
    const seenShops = new Set<string>();

    for (const token of tokens) {
      const found = await this.devices.findByToken(token);
      if (!found) continue;
      const { customer } = found;
      if (seenShops.has(customer.shopId)) continue;

      const shop = await this.shops.findById(customer.shopId);
      if (!shop) continue;
      seenShops.add(customer.shopId);

      const view = await loadCardView(
        {
          stampTypes: this.stampTypes,
          cards: this.cards,
          balances: this.balances,
        },
        shop.id,
        customer,
      );
      out.push({ shopName: shop.name, slug: shop.slug, view });
    }

    return out;
  }
}
