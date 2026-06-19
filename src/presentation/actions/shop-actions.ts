"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { assertShopActive } from "@/src/infrastructure/auth/billing-guard";
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
import { bahtToSatang } from "@/src/presentation/lib/money";
import type { Page } from "@/src/application/repositories/pagination";
import type { ShopImageKind, ShopReview } from "@/src/domain/entities";
import {
  buildCustomerRows,
  type CustomerRow,
} from "@/src/presentation/components/shop/customer-rows";

export interface FormState {
  error?: string;
  success?: string;
}

/** Owner temporarily closes their shop (freezes billing days). */
export async function pauseMyShopAction(): Promise<void> {
  const user = await requireRole("shop_owner");
  await new PauseShopUseCase(
    container.shopRepository,
    container.subscriptionRepository,
  ).execute(user.shopId!);
  revalidatePath("/shop");
  revalidatePath("/shop/settings");
}

/** Owner reopens their shop (resumes billing; remaining days unchanged). */
export async function resumeMyShopAction(): Promise<void> {
  const user = await requireRole("shop_owner");
  await new ResumeShopUseCase(container.subscriptionRepository).execute(
    user.shopId!,
  );
  revalidatePath("/shop");
  revalidatePath("/shop/settings");
}

/** Next page of the shop's customer list (optionally filtered by search). */
export async function loadMoreCustomersAction(
  search: string,
  cursor: string,
): Promise<Page<CustomerRow>> {
  const user = await requireRole("shop_owner");
  const shopId = user.shopId!;
  const page = await container.customerRepository.pageByShop(shopId, {
    cursor,
    search: search || undefined,
  });
  return {
    items: await buildCustomerRows(shopId, page.items),
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
  const user = await requireRole("shop_owner");
  if (!user.shopId) throw new Error("บัญชีนี้ไม่ได้ผูกกับร้านค้า");
  await assertShopActive(user.shopId);
  return user.shopId;
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
    const user = await requireRole("shop_owner");
    if (!user.shopId) throw new Error("บัญชีนี้ไม่ได้ผูกกับร้านค้า");
    await new ReplyToReviewUseCase(container.shopReviewRepository).execute(
      user.shopId,
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
  const user = await requireRole("shop_owner");
  return container.shopReviewRepository.pageByShop(user.shopId!, {
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
    const shopId = await ownerShopId();
    await new CreateStaffUseCase(
      container.userRepository,
      container.branchRepository,
      container.passwordHasher,
    ).execute({
      shopId,
      branchId: String(formData.get("branchId") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
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

/** Owner sets a new password for one of their staff (e.g. they forgot it). */
export async function resetStaffPasswordAction(
  userId: string,
  newPassword: string,
): Promise<{ error?: string }> {
  try {
    const shopId = await ownerShopId();
    const target = await container.userRepository.findById(userId);
    if (!target || target.shopId !== shopId || target.role !== "branch_staff") {
      throw new Error("ไม่พบพนักงานในร้านนี้");
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
