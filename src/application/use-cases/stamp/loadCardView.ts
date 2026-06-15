import type { Customer, CustomerCardView } from "@/src/domain/entities";
import { buildCardView } from "@/src/domain/services/card-view";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";

export interface CardViewDeps {
  stampTypes: IStampTypeRepository;
  cards: IStampCardRepository;
  balances: IStampBalanceRepository;
}

/** Assemble a customer's multi-type card view: active types + their balances. */
export async function loadCardView(
  deps: CardViewDeps,
  shopId: string,
  customer: Customer,
): Promise<CustomerCardView> {
  const types = await deps.stampTypes.listByShop(shopId, { activeOnly: true });
  const card = await deps.cards.findOrCreate(shopId, customer.id);
  const balances = await deps.balances.listByCard(card.id);
  return buildCardView(types, customer, balances);
}
