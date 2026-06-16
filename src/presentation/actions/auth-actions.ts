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
import { RequestLoginOtpUseCase } from "@/src/application/use-cases/auth/RequestLoginOtpUseCase";
import { VerifyLoginOtpUseCase } from "@/src/application/use-cases/auth/VerifyLoginOtpUseCase";
import { lineConfigFromEnv } from "@/src/infrastructure/services/LineMessagingPusher";
import { ROLE_HOME } from "@/src/domain/types/roles";

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export interface LoginFormState {
  error?: string;
}

/** Where the login UI should go next after the email step. */
export interface OtpRequestState {
  next?: "otp" | "password";
  error?: string;
}

/**
 * Step 1 of passwordless login: given an email, decide whether to send a LINE
 * OTP (linked account + LINE configured) or fall back to the password form.
 */
export async function requestLoginOtpAction(
  _prev: OtpRequestState,
  formData: FormData,
): Promise<OtpRequestState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.string().email().safeParse(email).success) {
    return { error: "อีเมลไม่ถูกต้อง" };
  }
  // No LINE on this server → OTP can't be delivered, so use password for everyone.
  if (lineConfigFromEnv() === null) return { next: "password" };

  const result = await new RequestLoginOtpUseCase(
    container.userRepository,
    container.passwordHasher,
    container.messagePusher,
  ).execute(email);

  if (result.status === "otp_sent") return { next: "otp" };
  if (result.status === "cooldown") {
    return { next: "otp", error: `ขอรหัสใหม่ได้ในอีก ${result.retryInSec} วินาที` };
  }
  return { next: "password" };
}

/** Step 2 of passwordless login: verify the OTP and start a session. */
export async function verifyLoginOtpAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const otp = String(formData.get("otp") ?? "").trim();
  if (!email || !otp) return { error: "กรุณากรอกรหัส OTP" };

  let user;
  try {
    user = await new VerifyLoginOtpUseCase(
      container.userRepository,
      container.passwordHasher,
    ).execute(email, otp);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!user) return { error: "รหัส OTP ไม่ถูกต้องหรือหมดอายุ" };

  await createSession(user.id);
  redirect(ROLE_HOME[user.role]);
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

/**
 * DEV ONLY — log in as any user without a password, for fast local testing.
 * Double-gated: this server action refuses to run unless NODE_ENV is
 * "development", so it can never create a session in preview/production even if
 * called directly. Mirrors the same guard used to render the dev switcher.
 */
export async function devLoginAsAction(userId: string): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Not available");
  }
  const user = await container.userRepository.findById(userId);
  if (!user || !user.isActive) {
    throw new Error("ผู้ใช้ไม่พร้อมใช้งาน");
  }
  await createSession(user.id);
  redirect(ROLE_HOME[user.role]);
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
