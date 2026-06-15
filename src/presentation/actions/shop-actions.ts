"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { assertShopActive } from "@/src/infrastructure/auth/billing-guard";
import { UpdateShopSettingsUseCase } from "@/src/application/use-cases/shop/UpdateShopSettingsUseCase";
import { CreateBranchUseCase } from "@/src/application/use-cases/shop/CreateBranchUseCase";
import { UpdateBranchLocationUseCase } from "@/src/application/use-cases/shop/UpdateBranchLocationUseCase";
import { CreateStaffUseCase } from "@/src/application/use-cases/shop/CreateStaffUseCase";
import { ResetPasswordUseCase } from "@/src/application/use-cases/auth/ResetPasswordUseCase";
import { CreateStampTypeUseCase } from "@/src/application/use-cases/stamp/CreateStampTypeUseCase";
import { UpdateStampTypeUseCase } from "@/src/application/use-cases/stamp/UpdateStampTypeUseCase";
import { SetStampTypeActiveUseCase } from "@/src/application/use-cases/stamp/SetStampTypeActiveUseCase";
import { bahtToSatang } from "@/src/presentation/lib/money";
import type { Page } from "@/src/application/repositories/pagination";
import {
  buildCustomerRows,
  type CustomerRow,
} from "@/src/presentation/components/shop/customer-rows";

export interface FormState {
  error?: string;
  success?: string;
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
