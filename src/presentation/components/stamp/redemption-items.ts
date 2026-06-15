import "server-only";

import { container } from "@/src/infrastructure/di/container";
import { formatPhone } from "@/src/domain/services/phone";
import type { RewardRedemption } from "@/src/domain/entities";
import type { RedemptionItem } from "./RedemptionHistory";

/** Attach customer + branch labels for the shop-facing redemption history. */
export async function buildShopRedemptionItems(
  shopId: string,
  redemptions: RewardRedemption[],
): Promise<RedemptionItem[]> {
  const [customers, branches] = await Promise.all([
    container.customerRepository.listByShop(shopId),
    container.branchRepository.listByShop(shopId),
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

/** Attach only branch labels for the customer's own redemption history. */
export async function buildCustomerRedemptionItems(
  shopId: string,
  redemptions: RewardRedemption[],
): Promise<RedemptionItem[]> {
  const branches = await container.branchRepository.listByShop(shopId);
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  return redemptions.map((r) => ({
    ...r,
    branchLabel: r.branchId ? (branchName.get(r.branchId) ?? null) : null,
  }));
}
