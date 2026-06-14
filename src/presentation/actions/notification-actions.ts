"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";

/** Mark every notification for the current operator as read. */
export async function markAllReadAction(): Promise<void> {
  const user = await requireRole(
    "shop_owner",
    "platform_admin",
    "branch_staff",
  );
  await container.notificationRepository.markAllRead(user.id);
  revalidatePath("/shop/notifications");
  revalidatePath("/admin/notifications");
}
