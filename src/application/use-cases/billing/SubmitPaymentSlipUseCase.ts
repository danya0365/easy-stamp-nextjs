import { nanoid } from "nanoid";

import type { Payment } from "@/src/domain/entities";
import type { IPaymentRepository } from "@/src/application/repositories/IPaymentRepository";
import type { ISubscriptionRepository } from "@/src/application/repositories/ISubscriptionRepository";
import type { ISlipStorage } from "@/src/application/services/ISlipStorage";

const PERIOD_DAYS = 30;
const MAX_SLIP_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/heic"];

export interface SubmitSlipInput {
  shopId: string;
  userId: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}

/** Owner uploads a PromptPay slip → creates a pending payment for admin review. */
export class SubmitPaymentSlipUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly subscriptions: ISubscriptionRepository,
    private readonly slipStorage: ISlipStorage,
  ) {}

  async execute(input: SubmitSlipInput): Promise<Payment> {
    if (!ALLOWED_TYPES.includes(input.contentType)) {
      throw new Error("รองรับเฉพาะรูปภาพ (PNG/JPG/WEBP)");
    }
    if (input.bytes.byteLength === 0) throw new Error("ไม่พบไฟล์สลิป");
    if (input.bytes.byteLength > MAX_SLIP_BYTES) {
      throw new Error("ไฟล์ใหญ่เกิน 5MB");
    }

    const sub = await this.subscriptions.findByShop(input.shopId);
    if (!sub) throw new Error("ยังไม่มีแพ็กเกจสำหรับร้านนี้");

    // New period extends from the later of now / current due date.
    const now = Date.now();
    const base = Math.max(now, new Date(sub.currentPeriodDueAt).getTime());
    const start = new Date(base).toISOString();
    const due = new Date(base + PERIOD_DAYS * 864e5).toISOString();

    const key = nanoid();
    const { url } = await this.slipStorage.save({
      shopId: input.shopId,
      paymentId: key,
      filename: input.filename,
      contentType: input.contentType,
      bytes: input.bytes,
    });

    return this.payments.create({
      shopId: input.shopId,
      subscriptionId: sub.id,
      amountSatang: sub.amountSatang,
      slipUrl: url,
      submittedBy: input.userId,
      coversPeriodStartAt: start,
      coversPeriodDueAt: due,
    });
  }
}
