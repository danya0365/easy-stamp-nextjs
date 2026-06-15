import "server-only";

import { container } from "@/src/infrastructure/di/container";
import type { Customer } from "@/src/domain/entities";

export interface CustomerRow {
  customer: Customer;
  /** How many stamp types this customer has completed (eligible to redeem). */
  eligible: number;
}

/**
 * Annotate customers with how many active stamp types they've completed.
 * Bounded to the given page of customers (one card + balance lookup each).
 */
export async function buildCustomerRows(
  shopId: string,
  customers: Customer[],
): Promise<CustomerRow[]> {
  const types = await container.stampTypeRepository.listByShop(shopId, {
    activeOnly: true,
  });
  return Promise.all(
    customers.map(async (customer) => {
      const card = await container.stampCardRepository.findByCustomer(
        shopId,
        customer.id,
      );
      if (!card) return { customer, eligible: 0 };
      const balances = await container.stampBalanceRepository.listByCard(
        card.id,
      );
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
