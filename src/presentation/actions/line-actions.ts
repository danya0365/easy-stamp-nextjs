"use server";

import { revalidatePath } from "next/cache";

import { container } from "@/src/infrastructure/di/container";
import { requireRole } from "@/src/infrastructure/auth/session";
import { GenerateLineLinkCodeUseCase } from "@/src/application/use-cases/line/GenerateLineLinkCodeUseCase";

/** Operator requests a one-time code to link their LINE account. */
export async function generateLineLinkCodeAction(): Promise<{ code: string }> {
  const user = await requireRole("shop_owner", "platform_admin");
  const code = await new GenerateLineLinkCodeUseCase(
    container.userRepository,
  ).execute(user.id);
  return { code };
}

/** Operator unlinks their LINE account (stops LINE push). */
export async function unlinkLineAction(): Promise<void> {
  const user = await requireRole("shop_owner", "platform_admin");
  await container.userRepository.setLineUserId(user.id, null);
  await container.userRepository.setLineLinkCode(user.id, null);
  revalidatePath("/shop/settings");
  revalidatePath("/admin");
}
