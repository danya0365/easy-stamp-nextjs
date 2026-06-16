"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { container } from "@/src/infrastructure/di/container";
import { isDevLoginEnabled } from "@/src/infrastructure/config/env";
import {
  createSession,
  destroySession,
  forgetAccount,
  getSession,
  rememberAccount,
} from "@/src/infrastructure/auth/session";
import { LoginUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { ChangePasswordUseCase } from "@/src/application/use-cases/auth/ChangePasswordUseCase";
import { RequestLoginOtpUseCase } from "@/src/application/use-cases/auth/RequestLoginOtpUseCase";
import { VerifyLoginOtpUseCase } from "@/src/application/use-cases/auth/VerifyLoginOtpUseCase";
import { lineConfigFromEnv } from "@/src/infrastructure/services/LineMessagingPusher";
import { getClientIp } from "@/src/presentation/lib/request-ip";
import { formatDateTime } from "@/src/presentation/lib/format-date";
import type { User } from "@/src/domain/entities";
import { ROLE_HOME } from "@/src/domain/types/roles";

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

// IP-based throttles (per fixed window). Generous enough for real users, but
// stop OTP-bombing / password stuffing. Per-account OTP cooldown/attempts still apply.
const OTP_IP_LIMIT = 10;
const OTP_IP_WINDOW_MS = 10 * 60_000;
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 10 * 60_000;

export interface LoginFormState {
  error?: string;
}

/** Where the login UI should go next after the email step. */
export interface OtpRequestState {
  /** "otp" → OTP step · "password" → password step · "unavailable" → must use LINE but can't (offer contact admin). */
  next?: "otp" | "password" | "unavailable";
  /** OTP step only: whether to offer the "use password instead" fallback (admin yes; owner/staff no). */
  passwordAllowed?: boolean;
  error?: string;
}

/** Security alert pushed to the user's linked LINE after a successful sign-in. */
async function sendLoginAlert(user: User, method: string): Promise<void> {
  if (!user.lineUserId) return;
  try {
    await container.messagePusher.pushText(
      user.lineUserId,
      `🔐 เข้าสู่ระบบสำเร็จ\nเวลา ${formatDateTime(new Date().toISOString())} · วิธี: ${method}\nหากไม่ใช่คุณ โปรดติดต่อผู้ดูแลทันที`,
    );
  } catch {
    // Never block login on a push failure.
  }
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

  // IP rate-limit (anti OTP-bombing across many emails).
  const ip = await getClientIp();
  const rl = await container.rateLimitRepository.hit(
    `otp:ip:${ip}`,
    OTP_IP_LIMIT,
    OTP_IP_WINDOW_MS,
  );
  if (!rl.allowed) {
    return { error: `พยายามหลายครั้งเกินไป ลองใหม่ในอีก ${rl.retryAfterSec} วินาที` };
  }

  const result = await new RequestLoginOtpUseCase(
    container.userRepository,
    container.passwordHasher,
    container.messagePusher,
  ).execute(email, lineConfigFromEnv() !== null);

  if (result.status === "otp_sent") {
    return { next: "otp", passwordAllowed: result.passwordAllowed };
  }
  if (result.status === "cooldown") {
    return {
      next: "otp",
      passwordAllowed: result.passwordAllowed,
      error: `ขอรหัสใหม่ได้ในอีก ${result.retryInSec} วินาที`,
    };
  }
  if (result.status === "otp_unavailable") return { next: "unavailable" };
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

  await rememberAccount({ email: user.email, role: user.role });
  await createSession(user.id);
  await sendLoginAlert(user, "LINE OTP");
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

  // IP+email rate-limit (anti password stuffing).
  const ip = await getClientIp();
  const rl = await container.rateLimitRepository.hit(
    `login:${ip}:${parsed.data.email.toLowerCase()}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS,
  );
  if (!rl.allowed) {
    return {
      error: `พยายามเข้าสู่ระบบหลายครั้งเกินไป ลองใหม่ในอีก ${rl.retryAfterSec} วินาที`,
    };
  }

  const useCase = new LoginUseCase(
    container.userRepository,
    container.passwordHasher,
  );
  const user = await useCase.execute(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await rememberAccount({ email: user.email, role: user.role });
  await createSession(user.id);
  await sendLoginAlert(user, "รหัสผ่าน");
  // redirect throws — must run outside the validation path above.
  redirect(ROLE_HOME[user.role]);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/** Remove a remembered account from this device's login switcher. */
export async function forgetAccountAction(email: string): Promise<void> {
  await forgetAccount(email);
}

export interface PasswordFormState {
  error?: string;
  success?: string;
}

/**
 * DEV ONLY — log in as any user without a password, for fast local testing.
 * Double-gated: this server action refuses to run unless `isDevLoginEnabled`
 * (local dev, never on Vercel), so it can never create a session in
 * preview/production even if called directly. Same flag gates the UI switcher.
 */
export async function devLoginAsAction(userId: string): Promise<void> {
  if (!isDevLoginEnabled) {
    throw new Error("Not available");
  }
  const user = await container.userRepository.findById(userId);
  if (!user || !user.isActive) {
    throw new Error("ผู้ใช้ไม่พร้อมใช้งาน");
  }
  await rememberAccount({ email: user.email, role: user.role });
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
