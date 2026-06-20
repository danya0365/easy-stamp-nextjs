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
import { GetCardByDeviceTokenUseCase } from "@/src/application/use-cases/member/GetCardByDeviceTokenUseCase";
import { getMemberToken } from "@/src/infrastructure/auth/member";
import { getClientIp } from "@/src/presentation/lib/request-ip";

// Velocity guard on stamp issuance (per operator, per shop). Generous for real
// staff, but a compromised account mass-issuing stamps trips it → admin alert.
const STAMP_ADD_VELOCITY_LIMIT = 200;
const STAMP_ADD_VELOCITY_WINDOW_MS = 60 * 60_000; // 1 ชม.
import { renderQrDataUrl } from "@/src/infrastructure/services/qr";
import { getBaseUrl } from "@/src/presentation/lib/base-url";
import type { CustomerCardView } from "@/src/domain/entities";
import type { Page } from "@/src/application/repositories/pagination";
import { normalizePhone } from "@/src/domain/services/phone";
import {
  BuildRedemptionItemsUseCase,
  type RedemptionItem,
} from "@/src/application/use-cases/stamp/BuildRedemptionItemsUseCase";

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

    const guard = await container.sensitiveActionGuard.check({
      key: `stamp_add:${shopId}:${user.id}`,
      limit: STAMP_ADD_VELOCITY_LIMIT,
      windowMs: STAMP_ADD_VELOCITY_WINDOW_MS,
      shopId,
      actorUserId: user.id,
      ip: await getClientIp(),
      alertTitle: "⚠️ พบการเพิ่มแสตมป์ผิดปกติ",
      alertBody: `บัญชีหนึ่งเพิ่มแสตมป์เกิน ${STAMP_ADD_VELOCITY_LIMIT} ครั้ง/ชม. ในร้านเดียว — อาจเป็นบัญชีที่ถูกเข้าถึงโดยไม่ได้รับอนุญาต`,
      metadata: { performedBy: user.id },
    });
    if (!guard.allowed) {
      return {
        phone,
        error:
          "ตรวจพบการเพิ่มแสตมป์ถี่ผิดปกติ ระบบแจ้งผู้ดูแลแล้ว กรุณาลองใหม่ภายหลัง",
        searched: true,
      };
    }

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

/** Next page of the shop's reward-redemption history (history page "load more"). */
export async function loadMoreShopRedemptionsAction(
  cursor: string,
): Promise<Page<RedemptionItem>> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const page = await container.rewardRedemptionRepository.pageByShop(shopId, {
    cursor,
  });
  return {
    items: await new BuildRedemptionItemsUseCase(
      container.customerRepository,
      container.branchRepository,
    ).forShop(shopId, page.items),
    nextCursor: page.nextCursor,
  };
}

/** Next page of the customer's own redemption history for one shop (by slug). */
export async function loadMoreMyRedemptionsAction(
  slug: string,
  cursor: string,
): Promise<Page<RedemptionItem>> {
  const shop = await container.shopRepository.findBySlug(slug);
  const token = shop ? await getMemberToken(slug) : null;
  const view =
    shop && token
      ? await new GetCardByDeviceTokenUseCase(
          container.shopRepository,
          container.customerDeviceRepository,
          container.stampCardRepository,
          container.stampTypeRepository,
          container.stampBalanceRepository,
        ).execute(shop.id, token)
      : null;
  if (!shop || !view) return { items: [], nextCursor: null };

  const page = await container.rewardRedemptionRepository.pageByCustomer(
    shop.id,
    view.customer.id,
    { cursor },
  );
  return {
    items: await new BuildRedemptionItemsUseCase(
      container.customerRepository,
      container.branchRepository,
    ).forCustomer(shop.id, page.items),
    nextCursor: page.nextCursor,
  };
}
