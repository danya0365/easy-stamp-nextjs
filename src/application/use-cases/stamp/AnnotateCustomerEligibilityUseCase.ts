import type { Customer } from "@/src/domain/entities";
import type { IStampTypeRepository } from "@/src/application/repositories/IStampTypeRepository";
import type { IStampCardRepository } from "@/src/application/repositories/IStampCardRepository";
import type { IStampBalanceRepository } from "@/src/application/repositories/IStampBalanceRepository";

export interface CustomerRow {
  customer: Customer;
  /** How many stamp types this customer has completed (eligible to redeem). */
  eligible: number;
}

/**
 * Annotate a page of customers with how many active stamp types each has
 * completed (i.e. is eligible to redeem). One card + balance lookup per customer.
 */
export class AnnotateCustomerEligibilityUseCase {
  constructor(
    private readonly stampTypes: IStampTypeRepository,
    private readonly stampCards: IStampCardRepository,
    private readonly stampBalances: IStampBalanceRepository,
  ) {}

  async execute(
    shopId: string,
    customers: Customer[],
  ): Promise<CustomerRow[]> {
    const types = await this.stampTypes.listByShop(shopId, {
      activeOnly: true,
    });
    return Promise.all(
      customers.map(async (customer) => {
        const card = await this.stampCards.findByCustomer(shopId, customer.id);
        if (!card) return { customer, eligible: 0 };
        const balances = await this.stampBalances.listByCard(card.id);
        const byType = new Map(
          balances.map((b) => [b.stampTypeId, b.currentStamps]),
        );
        const eligible = types.filter(
          (t) => (byType.get(t.id) ?? 0) >= t.threshold,
        ).length;
        return { customer, eligible };
      }),
    );
  }
}
