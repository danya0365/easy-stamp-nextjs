"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { assertShopActive } from "@/src/infrastructure/auth/billing-guard";
import { GetCustomerCardUseCase } from "@/src/application/use-cases/stamp/GetCustomerCardUseCase";
import { GetCardByPublicCodeUseCase } from "@/src/application/use-cases/stamp/GetCardByPublicCodeUseCase";
import { AddStampsUseCase } from "@/src/application/use-cases/stamp/AddStampsUseCase";
import { RedeemRewardUseCase } from "@/src/application/use-cases/stamp/RedeemRewardUseCase";
import { GenerateBindCodeUseCase } from "@/src/application/use-cases/member/GenerateBindCodeUseCase";
import { renderQrDataUrl } from "@/src/infrastructure/services/qr";
import { getBaseUrl } from "@/src/presentation/lib/base-url";
import type { CustomerCardView } from "@/src/domain/entities";
import { normalizePhone } from "@/src/domain/services/phone";

export interface StampActionState {
  phone?: string;
  view?: CustomerCardView | null;
  error?: string;
  success?: string;
  /** true once a lookup/action has run, so the UI can show results. */
  searched?: boolean;
}

/** Resolve the operating shop/branch from the authenticated operator. */
async function operatorContext() {
  const user = await requireRole("shop_owner", "branch_staff");
  if (!user.shopId) throw new Error("บัญชีนี้ไม่ได้ผูกกับร้านค้า");
  return { user, shopId: user.shopId, branchId: user.branchId ?? null };
}

export async function lookupCardAction(
  _prev: StampActionState,
  formData: FormData,
): Promise<StampActionState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  try {
    const { shopId } = await operatorContext();
    const view = await new GetCustomerCardUseCase(
      container.shopRepository,
      container.customerRepository,
      container.stampCardRepository,
      container.stampTypeRepository,
      container.stampBalanceRepository,
    ).execute(shopId, phone);
    return { phone, view, searched: true };
  } catch (e) {
    return { phone, error: (e as Error).message, searched: true };
  }
}

export async function lookupByCodeAction(
  _prev: StampActionState,
  formData: FormData,
): Promise<StampActionState> {
  const code = String(formData.get("code") ?? "").trim();
  try {
    const { shopId } = await operatorContext();
    const view = await new GetCardByPublicCodeUseCase(
      container.shopRepository,
      container.customerRepository,
      container.stampCardRepository,
      container.stampTypeRepository,
      container.stampBalanceRepository,
    ).execute(shopId, code);
    if (!view) {
      return { error: "ไม่พบลูกค้าจาก QR นี้ (อาจเป็น QR ของร้านอื่น)", searched: true };
    }
    // Carry the resolved phone so add/redeem (which key on phone) work as-is.
    return { phone: view.customer.phone, view, searched: true };
  } catch (e) {
    return { error: (e as Error).message, searched: true };
  }
}

export async function addStampsAction(
  _prev: StampActionState,
  formData: FormData,
): Promise<StampActionState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const quantity = Number(formData.get("quantity") ?? 1);
  const stampTypeId = String(formData.get("stampTypeId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim() || null;
  try {
    const { shopId, branchId, user } = await operatorContext();
    await assertShopActive(shopId);
    const view = await new AddStampsUseCase(
      container.shopRepository,
      container.customerRepository,
      container.stampCardRepository,
      container.stampTypeRepository,
      container.stampBalanceRepository,
      container.stampTransactionRepository,
    ).execute({
      shopId,
      branchId,
      phone,
      stampTypeId,
      quantity,
      displayName,
      performedBy: user.id,
    });
    revalidatePath("/staff");
    revalidatePath("/shop/customers");
    return {
      phone,
      view,
      searched: true,
      success: `เพิ่ม ${quantity} แสตมป์แล้ว`,
    };
  } catch (e) {
    return { phone, error: (e as Error).message, searched: true };
  }
}

export interface BindCodeState {
  imageUrl?: string;
  error?: string;
}

/** Staff generates a one-time bind QR for a customer (by phone) to scan. */
export async function generateBindCodeAction(
  phone: string,
): Promise<BindCodeState> {
  try {
    const { shopId } = await operatorContext();
    const shop = await container.shopRepository.findById(shopId);
    if (!shop) throw new Error("ไม่พบร้านค้า");
    const { code } = await new GenerateBindCodeUseCase(
      container.customerRepository,
      container.bindCodeRepository,
    ).execute(shopId, phone);
    const url = `${await getBaseUrl()}/s/${shop.slug}/link?code=${code}`;
    return { imageUrl: await renderQrDataUrl(url) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function redeemRewardAction(
  _prev: StampActionState,
  formData: FormData,
): Promise<StampActionState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const stampTypeId = String(formData.get("stampTypeId") ?? "");
  try {
    const { shopId, branchId, user } = await operatorContext();
    await assertShopActive(shopId);
    const view = await new RedeemRewardUseCase(
      container.shopRepository,
      container.customerRepository,
      container.stampCardRepository,
      container.stampTypeRepository,
      container.stampBalanceRepository,
      container.stampTransactionRepository,
      container.rewardRedemptionRepository,
    ).execute({ shopId, branchId, phone, stampTypeId, performedBy: user.id });
    revalidatePath("/staff");
    revalidatePath("/shop/customers");
    return { phone, view, searched: true, success: "แลกรางวัลสำเร็จ" };
  } catch (e) {
    return { phone, error: (e as Error).message, searched: true };
  }
}
