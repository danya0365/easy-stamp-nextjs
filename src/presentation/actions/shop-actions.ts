"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireShopWrite } from "@/src/infrastructure/auth/session";
import {
  assertShopActive,
  getBillingState,
} from "@/src/infrastructure/auth/billing-guard";
import { UpdateShopSettingsUseCase } from "@/src/application/use-cases/shop/UpdateShopSettingsUseCase";
import { CreateBranchUseCase } from "@/src/application/use-cases/shop/CreateBranchUseCase";
import { UpdateBranchLocationUseCase } from "@/src/application/use-cases/shop/UpdateBranchLocationUseCase";
import { CreateStaffUseCase } from "@/src/application/use-cases/shop/CreateStaffUseCase";
import { PauseShopUseCase } from "@/src/application/use-cases/billing/PauseShopUseCase";
import { ResumeShopUseCase } from "@/src/application/use-cases/billing/ResumeShopUseCase";
import { ResetPasswordUseCase } from "@/src/application/use-cases/auth/ResetPasswordUseCase";
import { CreateStampTypeUseCase } from "@/src/application/use-cases/stamp/CreateStampTypeUseCase";
import { UpdateStampTypeUseCase } from "@/src/application/use-cases/stamp/UpdateStampTypeUseCase";
import { SetStampTypeActiveUseCase } from "@/src/application/use-cases/stamp/SetStampTypeActiveUseCase";
import { SaveShopImageUseCase } from "@/src/application/use-cases/shop/SaveShopImageUseCase";
import { DeleteShopImageUseCase } from "@/src/application/use-cases/shop/DeleteShopImageUseCase";
import { UpdateShopProfileUseCase } from "@/src/application/use-cases/shop/UpdateShopProfileUseCase";
import { ReplyToReviewUseCase } from "@/src/application/use-cases/review/ReplyToReviewUseCase";
import {
  AnnotateCustomerEligibilityUseCase,
  type CustomerRow,
} from "@/src/application/use-cases/stamp/AnnotateCustomerEligibilityUseCase";
import { bahtToSatang } from "@/src/presentation/lib/money";
import { AUDIT_ACTIONS } from "@/src/application/services/AuditLogger";
import { assertPasswordAcceptable } from "@/src/application/use-cases/auth/password-policy";
import { getClientIp } from "@/src/presentation/lib/request-ip";
import type { Page } from "@/src/application/repositories/pagination";
import type { ShopImageKind, ShopReview, AuditLog } from "@/src/domain/entities";

export interface FormState {
  error?: string;
  success?: string;
}

// Abuse guard-rails for "temporarily close shop": pausing freezes billing days,
// so unbounded toggling invites gaming. Cap how often a shop may pause, and
// enforce a cooldown between closures. (The economic loophole — stretching one
// paid day across calendar days by closing off-hours — is already neutralized by
// whole-day-floor crediting in resumeDueDate; these add visibility + churn limits.)
const PAUSE_MAX_PER_30D = 8;
const PAUSE_CAP_WINDOW_MS = 30 * 24 * 60 * 60_000; // 30 วัน
const PAUSE_COOLDOWN_MS = 24 * 60 * 60_000; // 24 ชม.

/** Owner temporarily closes their shop (freezes billing days). */
export async function pauseMyShopAction(): Promise<{ error?: string }> {
  try {
    const { actor, shopId } = await requireShopWrite();

    // Only enforce quotas on a real active→paused transition (skip no-ops).
    const { status } = await getBillingState(shopId);
    if (status.isPaused) return {}; // already closed — nothing to do
    if (status.isSuspended) {
      return { error: "ร้านถูกระงับอยู่ ไม่สามารถปิดชั่วคราวได้" };
    }

    // Cooldown: at most one closure per 24h (no admin alert — just "wait").
    const cd = await container.rateLimitRepository.hit(
      `shop_pause_cd:${shopId}`,
      1,
      PAUSE_COOLDOWN_MS,
    );
    if (!cd.allowed) {
      const hrs = Math.max(1, Math.ceil(cd.retryAfterSec / 3600));
      return {
        error: `เพิ่งปิด/เปิดร้านไปไม่นาน กรุณารออีกประมาณ ${hrs} ชม. ก่อนปิดอีกครั้ง`,
      };
    }

    // Monthly cap: alerts admins + owner once when the threshold trips.
    const ip = await getClientIp();
    const cap = await container.sensitiveActionGuard.check({
      key: `shop_pause_cap:${shopId}`,
      limit: PAUSE_MAX_PER_30D,
      windowMs: PAUSE_CAP_WINDOW_MS,
      shopId,
      actorUserId: actor.id,
      ip,
      alertTitle: "⚠️ ร้านปิดชั่วคราวบ่อยผิดปกติ",
      alertBody: `ร้านหนึ่งปิดชั่วคราวเกิน ${PAUSE_MAX_PER_30D} ครั้งใน 30 วัน — อาจกำลังเลี่ยงการนับวันใช้งาน`,
    });
    if (!cap.allowed) {
      return {
        error: `เดือนนี้ปิดร้านครบ ${PAUSE_MAX_PER_30D} ครั้งแล้ว ระบบแจ้งผู้ดูแลแล้ว หากจำเป็นโปรดติดต่อผู้ดูแล`,
      };
    }

    await new PauseShopUseCase(
      container.shopRepository,
      container.subscriptionRepository,
    ).execute(shopId);

    await container.auditLogger.record({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.shopPaused,
      targetType: "shop",
      targetId: shopId,
      shopId,
      ip,
    });

    revalidatePath("/shop");
    revalidatePath("/shop/settings");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Owner reopens their shop (resumes billing; remaining whole days unchanged). */
export async function resumeMyShopAction(): Promise<{ error?: string }> {
  try {
    const { actor, shopId } = await requireShopWrite();
    const changed = await new ResumeShopUseCase(
      container.subscriptionRepository,
    ).execute(shopId);

    if (changed) {
      await container.auditLogger.record({
        actorUserId: actor.id,
        actorRole: actor.role,
        action: AUDIT_ACTIONS.shopResumed,
        targetType: "shop",
        targetId: shopId,
        shopId,
        ip: await getClientIp(),
      });
      revalidatePath("/shop");
      revalidatePath("/shop/settings");
    }
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Next page of the shop's customer list (optionally filtered by search). */
export async function loadMoreCustomersAction(
  search: string,
  cursor: string,
): Promise<Page<CustomerRow>> {
  const { shopId } = await requireShopWrite();
  const page = await container.customerRepository.pageByShop(shopId, {
    cursor,
    search: search || undefined,
  });
  return {
    items: await new AnnotateCustomerEligibilityUseCase(
      container.stampTypeRepository,
      container.stampCardRepository,
      container.stampBalanceRepository,
    ).execute(shopId, page.items),
    nextCursor: page.nextCursor,
  };
}

/** Parse an optional baht price field → satang or null. */
function parsePriceSatang(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const baht = Number(trimmed);
  if (!Number.isFinite(baht) || baht < 0) throw new Error("ราคาไม่ถูกต้อง");
  return bahtToSatang(baht);
}

async function ownerShopId(): Promise<string> {
  const { shopId } = await requireShopWrite();
  await assertShopActive(shopId);
  return shopId;
}

export async function updateSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const shopId = await ownerShopId();
    await new UpdateShopSettingsUseCase(container.shopRepository).execute(shopId, {
      stampThreshold: Number(formData.get("stampThreshold") ?? 10),
      rewardText: String(formData.get("rewardText") ?? ""),
    });
    revalidatePath("/shop/settings");
    return { success: "บันทึกการตั้งค่าแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Owner edits the shop's public details (about / hours / contact). */
export async function updateShopProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const shopId = await ownerShopId();
    await new UpdateShopProfileUseCase(container.shopProfileRepository).execute(
      shopId,
      {
        description: String(formData.get("description") ?? ""),
        openingHours: String(formData.get("openingHours") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        lineUrl: String(formData.get("lineUrl") ?? ""),
        facebookUrl: String(formData.get("facebookUrl") ?? ""),
        instagramUrl: String(formData.get("instagramUrl") ?? ""),
        websiteUrl: String(formData.get("websiteUrl") ?? ""),
      },
    );
    revalidatePath("/shop/settings");
    const slug = (await container.shopRepository.findById(shopId))?.slug;
    if (slug) revalidatePath(`/s/${slug}`);
    return { success: "บันทึกรายละเอียดร้านแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Owner uploads a shop profile image (kind=profile) or gallery photo. */
export async function uploadShopImageAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const shopId = await ownerShopId();
    const kind = String(formData.get("kind") ?? "") as ShopImageKind;
    if (kind !== "profile" && kind !== "gallery" && kind !== "cover") {
      throw new Error("ประเภทรูปไม่ถูกต้อง");
    }
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("กรุณาแนบรูป");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    await new SaveShopImageUseCase(
      container.shopImageRepository,
      container.slipStorage,
    ).execute({
      shopId,
      kind,
      filename: file.name,
      contentType: file.type,
      bytes,
    });
    revalidatePath("/shop/settings");
    revalidatePath(`/s/${(await container.shopRepository.findById(shopId))?.slug ?? ""}`);
    return { success: "อัปโหลดรูปแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Owner removes one of their shop images. */
export async function deleteShopImageAction(
  imageId: string,
): Promise<{ error?: string }> {
  try {
    const shopId = await ownerShopId();
    await new DeleteShopImageUseCase(
      container.shopImageRepository,
      container.slipStorage,
    ).execute(shopId, imageId);
    revalidatePath("/shop/settings");
    const slug = (await container.shopRepository.findById(shopId))?.slug;
    if (slug) revalidatePath(`/s/${slug}`);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Owner replies to a review of their own shop (works even when paused). */
export async function replyToReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const { shopId } = await requireShopWrite();
    await new ReplyToReviewUseCase(container.shopReviewRepository).execute(
      shopId,
      String(formData.get("reviewId") ?? ""),
      String(formData.get("reply") ?? ""),
    );
    revalidatePath("/shop/reviews");
    return { success: "ตอบกลับแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Next page of the shop's own reviews (owner view — includes hidden). */
export async function loadMoreShopReviewsAction(
  cursor: string,
): Promise<Page<ShopReview>> {
  const { shopId } = await requireShopWrite();
  return container.shopReviewRepository.pageByShop(shopId, {
    cursor,
    includeHidden: true,
  });
}

export async function createStampTypeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const shopId = await ownerShopId();
    await new CreateStampTypeUseCase(container.stampTypeRepository).execute({
      shopId,
      name: String(formData.get("name") ?? ""),
      threshold: Number(formData.get("threshold") ?? 10),
      rewardText: String(formData.get("rewardText") ?? ""),
      priceSatang: parsePriceSatang(String(formData.get("priceBaht") ?? "")),
    });
    revalidatePath("/shop/settings");
    return { success: "เพิ่มประเภทแสตมป์แล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateStampTypeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const shopId = await ownerShopId();
    await new UpdateStampTypeUseCase(container.stampTypeRepository).execute(
      shopId,
      String(formData.get("typeId") ?? ""),
      {
        name: String(formData.get("name") ?? ""),
        threshold: Number(formData.get("threshold") ?? 10),
        rewardText: String(formData.get("rewardText") ?? ""),
        priceSatang: parsePriceSatang(String(formData.get("priceBaht") ?? "")),
      },
    );
    revalidatePath("/shop/settings");
    return { success: "บันทึกประเภทแสตมป์แล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleStampTypeAction(
  typeId: string,
  isActive: boolean,
): Promise<void> {
  const shopId = await ownerShopId();
  await new SetStampTypeActiveUseCase(container.stampTypeRepository).execute(
    shopId,
    typeId,
    isActive,
  );
  revalidatePath("/shop/settings");
}

export async function createBranchAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const shopId = await ownerShopId();
    await new CreateBranchUseCase(container.branchRepository).execute(
      shopId,
      String(formData.get("name") ?? ""),
    );
    revalidatePath("/shop/branches");
    return { success: "เพิ่มสาขาแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleBranchAction(
  branchId: string,
  isActive: boolean,
): Promise<void> {
  const shopId = await ownerShopId();
  const branch = await container.branchRepository.findById(branchId);
  if (!branch || branch.shopId !== shopId) throw new Error("ไม่พบสาขาในร้านนี้");
  await container.branchRepository.setActive(branchId, isActive);
  revalidatePath("/shop/branches");
}

export async function updateBranchLocationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const shopId = await ownerShopId();
    const branchId = String(formData.get("branchId") ?? "");
    const latRaw = String(formData.get("latitude") ?? "").trim();
    const lngRaw = String(formData.get("longitude") ?? "").trim();
    const parse = (v: string): number | null => {
      if (v === "") return null;
      const n = Number(v);
      if (Number.isNaN(n)) throw new Error("พิกัดไม่ถูกต้อง");
      return n;
    };
    await new UpdateBranchLocationUseCase(container.branchRepository).execute(
      shopId,
      branchId,
      {
        latitude: parse(latRaw),
        longitude: parse(lngRaw),
        address: String(formData.get("address") ?? ""),
      },
    );
    revalidatePath("/shop/branches");
    revalidatePath("/");
    return { success: "บันทึกตำแหน่งแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function createStaffAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const { actor, shopId } = await requireShopWrite();
    await assertShopActive(shopId);
    const password = String(formData.get("password") ?? "");
    await assertPasswordAcceptable(password, container.passwordBreachChecker);
    const staff = await new CreateStaffUseCase(
      container.userRepository,
      container.branchRepository,
      container.passwordHasher,
    ).execute({
      shopId,
      branchId: String(formData.get("branchId") ?? ""),
      email: String(formData.get("email") ?? ""),
      password,
    });
    await container.auditLogger.record({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.staffCreated,
      targetType: "user",
      targetId: staff.id,
      shopId,
      ip: await getClientIp(),
      metadata: { email: staff.email },
    });
    revalidatePath("/shop/staff");
    return { success: "เพิ่มพนักงานแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleStaffAction(
  userId: string,
  isActive: boolean,
): Promise<void> {
  const shopId = await ownerShopId();
  const target = await container.userRepository.findById(userId);
  if (!target || target.shopId !== shopId || target.role !== "branch_staff") {
    throw new Error("ไม่พบพนักงานในร้านนี้");
  }
  await container.userRepository.setActive(userId, isActive);
  revalidatePath("/shop/staff");
}

/** Owner force-logs-out one of their staff from all devices (compromised account). */
export async function forceLogoutStaffAction(
  userId: string,
): Promise<{ error?: string }> {
  try {
    const { actor, shopId } = await requireShopWrite();
    const target = await container.userRepository.findById(userId);
    if (!target || target.shopId !== shopId || target.role !== "branch_staff") {
      throw new Error("ไม่พบพนักงานในร้านนี้");
    }
    await container.sessionRepository.deleteAllForUser(userId);
    await container.auditLogger.record({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.forceLogout,
      targetType: "user",
      targetId: userId,
      shopId,
      ip: await getClientIp(),
      metadata: { email: target.email },
    });
    revalidatePath("/shop/staff");
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/** Next page of this shop's own audit trail (owner Security page "load more"). */
export async function loadMoreShopAuditAction(
  cursor: string,
): Promise<Page<AuditLog>> {
  const { shopId } = await requireShopWrite();
  return container.auditLogRepository.pageByShop(shopId, { cursor });
}

/** Owner sets a new password for one of their staff (e.g. they forgot it). */
export async function resetStaffPasswordAction(
  userId: string,
  newPassword: string,
): Promise<{ error?: string }> {
  try {
    const { actor, shopId } = await requireShopWrite();
    const target = await container.userRepository.findById(userId);
    if (!target || target.shopId !== shopId || target.role !== "branch_staff") {
      throw new Error("ไม่พบพนักงานในร้านนี้");
    }
    await new ResetPasswordUseCase(
      container.userRepository,
      container.passwordHasher,
      container.sessionRepository,
      container.passwordBreachChecker,
    ).execute(userId, newPassword);
    await container.auditLogger.record({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: AUDIT_ACTIONS.passwordResetByAdmin,
      targetType: "user",
      targetId: userId,
      shopId,
      ip: await getClientIp(),
    });
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
