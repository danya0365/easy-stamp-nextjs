"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { VerifyPaymentUseCase } from "@/src/application/use-cases/billing/VerifyPaymentUseCase";
import { CreateShopUseCase } from "@/src/application/use-cases/shop/CreateShopUseCase";
import { ResetPasswordUseCase } from "@/src/application/use-cases/auth/ResetPasswordUseCase";
import { bahtToSatang, satangToBaht } from "@/src/presentation/lib/money";
import type { Page } from "@/src/application/repositories/pagination";
import type { PendingPaymentRow } from "@/src/presentation/components/admin/AdminPaymentQueue";

export interface AdminFormState {
  error?: string;
  success?: string;
}

/** Next page of the pending-payment review queue (admin "load more"). */
export async function loadMorePendingPaymentsAction(
  cursor: string,
): Promise<Page<PendingPaymentRow>> {
  await requireRole("platform_admin");
  const page = await container.paymentRepository.pageByStatus("pending", {
    cursor,
  });
  const shops = await container.shopRepository.list();
  const shopName = new Map(shops.map((s) => [s.id, s.name]));
  return {
    items: page.items.map((payment) => ({
      payment,
      shopName: shopName.get(payment.shopId) ?? payment.shopId,
    })),
    nextCursor: page.nextCursor,
  };
}

export async function createShopAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  try {
    await requireRole("platform_admin");
    await new CreateShopUseCase(
      container.shopRepository,
      container.userRepository,
      container.subscriptionRepository,
      container.passwordHasher,
      container.shopCategoryRepository,
      container.stampTypeRepository,
    ).execute({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      ownerEmail: String(formData.get("ownerEmail") ?? ""),
      ownerPassword: String(formData.get("ownerPassword") ?? ""),
      pricePerDaySatang: bahtToSatang(
        Number(formData.get("pricePerDayBaht") ?? 0),
      ),
      categoryId: String(formData.get("categoryId") ?? "") || null,
      stampThreshold: Number(formData.get("stampThreshold") ?? 10),
      rewardText: String(formData.get("rewardText") ?? ""),
    });
    revalidatePath("/admin/shops");
    return { success: "สร้างร้านค้าและบัญชีเจ้าของร้านแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function verifyPaymentAction(
  paymentId: string,
  decision: "approve" | "reject",
  rejectReason?: string,
): Promise<void> {
  const admin = await requireRole("platform_admin");
  const payment = await new VerifyPaymentUseCase(
    container.paymentRepository,
    container.subscriptionRepository,
    container.paymentVerifier,
    container.topupTransactionRepository,
  ).execute({ paymentId, reviewerUserId: admin.id, decision, rejectReason });

  // Tell the shop owner the outcome (best-effort: in-app + LINE).
  const amount = satangToBaht(payment.amountSatang);
  if (payment.status === "approved") {
    await container.notificationService.notifyShopOwner(payment.shopId, {
      type: "payment_approved",
      title: "อนุมัติการชำระเงินแล้ว ✅",
      body: `ชำระเงิน ${amount} บาท ได้รับการอนุมัติ — เติมวันใช้งานเรียบร้อย`,
      linkUrl: "/shop/billing",
    });
  } else {
    await container.notificationService.notifyShopOwner(payment.shopId, {
      type: "payment_rejected",
      title: "การชำระเงินถูกปฏิเสธ",
      body: payment.rejectReason
        ? `ชำระเงิน ${amount} บาท ถูกปฏิเสธ — เหตุผล: ${payment.rejectReason}`
        : `ชำระเงิน ${amount} บาท ถูกปฏิเสธ กรุณาตรวจสอบและส่งใหม่`,
      linkUrl: "/shop/billing",
    });
  }

  revalidatePath("/admin/payments");
  revalidatePath("/admin/shops");
}

export async function setShopStatusAction(
  shopId: string,
  status: "active" | "suspended_by_admin",
): Promise<void> {
  await requireRole("platform_admin");
  await container.shopRepository.setStatus(shopId, status);
  revalidatePath("/admin/shops");
}

/** Admin sets a new password for a shop owner (e.g. they forgot it). */
export async function adminResetOwnerPasswordAction(
  userId: string,
  newPassword: string,
): Promise<{ error?: string }> {
  try {
    await requireRole("platform_admin");
    const target = await container.userRepository.findById(userId);
    if (!target || target.role !== "shop_owner") {
      throw new Error("ไม่พบบัญชีเจ้าของร้าน");
    }
    await new ResetPasswordUseCase(
      container.userRepository,
      container.passwordHasher,
    ).execute(userId, newPassword);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
