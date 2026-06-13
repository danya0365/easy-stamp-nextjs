"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { assertShopActive } from "@/src/infrastructure/auth/billing-guard";
import { UpdateShopSettingsUseCase } from "@/src/application/use-cases/shop/UpdateShopSettingsUseCase";
import { CreateBranchUseCase } from "@/src/application/use-cases/shop/CreateBranchUseCase";
import { UpdateBranchLocationUseCase } from "@/src/application/use-cases/shop/UpdateBranchLocationUseCase";
import { CreateStaffUseCase } from "@/src/application/use-cases/shop/CreateStaffUseCase";

export interface FormState {
  error?: string;
  success?: string;
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
