"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { SubmitPaymentSlipUseCase } from "@/src/application/use-cases/billing/SubmitPaymentSlipUseCase";

export interface BillingFormState {
  error?: string;
  success?: string;
}

export async function submitSlipAction(
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  try {
    // NOTE: intentionally no assertShopActive — paying must work while suspended.
    const user = await requireRole("shop_owner");
    if (!user.shopId) throw new Error("บัญชีนี้ไม่ได้ผูกกับร้านค้า");

    const file = formData.get("slip");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("กรุณาแนบรูปสลิป");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());

    await new SubmitPaymentSlipUseCase(
      container.paymentRepository,
      container.subscriptionRepository,
      container.slipStorage,
    ).execute({
      shopId: user.shopId,
      userId: user.id,
      filename: file.name,
      contentType: file.type,
      bytes,
    });

    revalidatePath("/shop/billing");
    return { success: "ส่งสลิปแล้ว รอผู้ดูแลตรวจสอบ" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
