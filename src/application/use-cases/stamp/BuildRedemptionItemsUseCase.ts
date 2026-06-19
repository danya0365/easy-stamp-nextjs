import type { RewardRedemption } from "@/src/domain/entities";
import { formatPhone } from "@/src/domain/services/phone";
import type { ICustomerRepository } from "@/src/application/repositories/ICustomerRepository";
import type { IBranchRepository } from "@/src/application/repositories/IBranchRepository";

export interface RedemptionItem extends RewardRedemption {
  /** Customer name/phone — only shown on the shop-facing list. */
  customerLabel?: string;
  /** Branch name, when the redemption was tied to a branch. */
  branchLabel?: string | null;
}

/**
 * Attach human-readable customer/branch labels to redemption rows for display.
 * Shop view shows both labels; the customer's own view shows only the branch.
 */
export class BuildRedemptionItemsUseCase {
  constructor(
    private readonly customers: ICustomerRepository,
    private readonly branches: IBranchRepository,
  ) {}

  /** Shop-facing history: attach customer + branch labels. */
  async forShop(
    shopId: string,
    redemptions: RewardRedemption[],
  ): Promise<RedemptionItem[]> {
    const [customers, branches] = await Promise.all([
      this.customers.listByShop(shopId),
      this.branches.listByShop(shopId),
    ]);
    const customerName = new Map(
      customers.map((c) => [c.id, c.displayName || formatPhone(c.phone)]),
    );
    const branchName = new Map(branches.map((b) => [b.id, b.name]));
    return redemptions.map((r) => ({
      ...r,
      customerLabel: customerName.get(r.customerId) ?? "ลูกค้า",
      branchLabel: r.branchId ? (branchName.get(r.branchId) ?? null) : null,
    }));
  }

  /** Customer's own history: attach only branch labels. */
  async forCustomer(
    shopId: string,
    redemptions: RewardRedemption[],
  ): Promise<RedemptionItem[]> {
    const branches = await this.branches.listByShop(shopId);
    const branchName = new Map(branches.map((b) => [b.id, b.name]));
    return redemptions.map((r) => ({
      ...r,
      branchLabel: r.branchId ? (branchName.get(r.branchId) ?? null) : null,
    }));
  }
}
