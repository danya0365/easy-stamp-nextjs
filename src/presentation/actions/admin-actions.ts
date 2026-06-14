"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { VerifyPaymentUseCase } from "@/src/application/use-cases/billing/VerifyPaymentUseCase";
import { CreateShopUseCase } from "@/src/application/use-cases/shop/CreateShopUseCase";
import { ResetPasswordUseCase } from "@/src/application/use-cases/auth/ResetPasswordUseCase";
import { bahtToSatang } from "@/src/presentation/lib/money";

export interface AdminFormState {
  error?: string;
  success?: string;
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
  await new VerifyPaymentUseCase(
    container.paymentRepository,
    container.subscriptionRepository,
    container.paymentVerifier,
    container.topupTransactionRepository,
  ).execute({ paymentId, reviewerUserId: admin.id, decision, rejectReason });
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
