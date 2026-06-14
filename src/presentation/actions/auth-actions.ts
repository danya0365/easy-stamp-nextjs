"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import {
  createSession,
  destroySession,
  getSession,
} from "@/src/infrastructure/auth/session";
import { LoginUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { ChangePasswordUseCase } from "@/src/application/use-cases/auth/ChangePasswordUseCase";
import { ROLE_HOME } from "@/src/domain/types/roles";

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export interface LoginFormState {
  error?: string;
}

export async function loginAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const useCase = new LoginUseCase(
    container.userRepository,
    container.passwordHasher,
  );
  const user = await useCase.execute(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession(user.id);
  // redirect throws — must run outside the validation path above.
  redirect(ROLE_HOME[user.role]);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export interface PasswordFormState {
  error?: string;
  success?: string;
}

/** Any logged-in user changes their own password (verifies the current one). */
export async function changeMyPasswordAction(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  try {
    const user = await getSession();
    if (!user) return { error: "กรุณาเข้าสู่ระบบใหม่" };

    const current = String(formData.get("currentPassword") ?? "");
    const next = String(formData.get("newPassword") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");
    if (next !== confirm) return { error: "รหัสผ่านใหม่และยืนยันไม่ตรงกัน" };

    await new ChangePasswordUseCase(
      container.userRepository,
      container.passwordHasher,
    ).execute(user.id, current, next);

    return { success: "เปลี่ยนรหัสผ่านแล้ว" };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
