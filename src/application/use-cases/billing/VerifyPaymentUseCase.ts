import type { Payment } from "@/src/domain/entities";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import type { IPaymentVerifier } from "@/src/application/services/IPaymentVerifier";

export interface VerifyPaymentInput {
  paymentId: string;
  reviewerUserId: string;
  decision: "approve" | "reject";
  rejectReason?: string | null;
}

/**
 * Resolve a pending payment via the (swappable) IPaymentVerifier. On approval,
 * roll the subscription period forward. The use case is agnostic to whether
 * verification was manual or automated.
 */
export class VerifyPaymentUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly subscriptions: ISubscriptionRepository,
    private readonly verifier: IPaymentVerifier,
  ) {}

  async execute(input: VerifyPaymentInput): Promise<Payment> {
    const payment = await this.payments.findById(input.paymentId);
    if (!payment) throw new Error("ไม่พบรายการชำระเงิน");
    if (payment.status !== "pending") {
      throw new Error("รายการนี้ถูกตรวจสอบไปแล้ว");
    }

    const result = await this.verifier.verify({
      paymentId: payment.id,
      shopId: payment.shopId,
      decision: input.decision,
      reviewerUserId: input.reviewerUserId,
      rejectReason: input.rejectReason,
      slipUrl: payment.slipUrl,
      expectedAmountSatang: payment.amountSatang,
    });

    const resolved = await this.payments.resolve(payment.id, {
      status: result.approved ? "approved" : "rejected",
      verifiedBy: result.verifiedBy,
      verifiedAt: result.verifiedAt,
      rejectReason: result.approved ? null : result.reason,
    });

    if (
      result.approved &&
      payment.coversPeriodStartAt &&
      payment.coversPeriodDueAt
    ) {
      await this.subscriptions.advancePeriod(payment.subscriptionId, {
        currentPeriodStartAt: payment.coversPeriodStartAt,
        currentPeriodDueAt: payment.coversPeriodDueAt,
        status: "active",
      });
    }

    return resolved;
  }
}
