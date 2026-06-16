import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import { resumeDueDate } from "@/src/domain/services/subscription-status";

/**
 * Resume a paused shop: clear the pause and push the due date forward by the
 * paused duration, so the remaining days are exactly what they were at pause.
 */
export class ResumeShopUseCase {
  constructor(private readonly subscriptions: ISubscriptionRepository) {}

  async execute(shopId: string, now: Date = new Date()): Promise<void> {
    const sub = await this.subscriptions.findByShop(shopId);
    if (!sub) throw new Error("ไม่พบข้อมูลการใช้งานของร้าน");
    if (!sub.pausedAt) return; // not paused — no-op

    const newDue = resumeDueDate(sub.currentPeriodDueAt, sub.pausedAt, now);
    await this.subscriptions.resume(sub.id, newDue);
  }
}
