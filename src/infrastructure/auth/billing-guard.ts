import "server-only";

import { container } from "@/src/infrastructure/di/container";
import {
  GetBillingStateUseCase,
  type BillingState,
} from "@/src/application/use-cases/billing/GetBillingStateUseCase";

export function getBillingState(shopId: string): Promise<BillingState> {
  return new GetBillingStateUseCase(
    container.shopRepository,
    container.subscriptionRepository,
  ).execute(shopId);
}

/** Throw if the shop is suspended (overdue > grace or admin-suspended). */
export async function assertShopActive(shopId: string): Promise<void> {
  const { status } = await getBillingState(shopId);
  if (status.isSuspended) {
    throw new Error("ร้านถูกระงับเนื่องจากค้างชำระ กรุณาชำระเงินก่อนใช้งาน");
  }
}
