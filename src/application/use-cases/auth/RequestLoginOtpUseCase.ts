import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";
import type { IMessagePusher } from "@/src/application/services/IMessagePusher";
import {
  OTP_TTL_MS,
  RESEND_COOLDOWN_MS,
  generateOtp,
} from "./login-otp";

export type RequestOtpResult =
  | { status: "otp_sent" }
  | { status: "use_password" }
  | { status: "cooldown"; retryInSec: number };

/**
 * Generates a login OTP, stores its hash, and pushes the code to the user's LINE.
 * Returns "use_password" when the account can't use OTP (unknown email, inactive,
 * or no linked LINE) so the caller falls back to password without leaking which.
 */
export class RequestLoginOtpUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly pusher: IMessagePusher,
  ) {}

  async execute(email: string, now: number = Date.now()): Promise<RequestOtpResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.users.findByEmailWithSecret(normalizedEmail);
    if (!user || !user.isActive || !user.lineUserId) {
      return { status: "use_password" };
    }

    // Resend cooldown: only against a still-valid OTP (sentAt = expiry - TTL).
    const otp = await this.users.getLoginOtp(user.id);
    if (otp?.hash && otp.expiresAt) {
      const expiresMs = new Date(otp.expiresAt).getTime();
      if (expiresMs > now) {
        const nextAllowed = expiresMs - OTP_TTL_MS + RESEND_COOLDOWN_MS;
        if (now < nextAllowed) {
          return {
            status: "cooldown",
            retryInSec: Math.ceil((nextAllowed - now) / 1000),
          };
        }
      }
    }

    const code = generateOtp();
    const hash = await this.hasher.hash(code);
    const expiresAt = new Date(now + OTP_TTL_MS).toISOString();
    await this.users.setLoginOtp(user.id, hash, expiresAt);

    const minutes = Math.round(OTP_TTL_MS / 60_000);
    await this.pusher.pushText(
      user.lineUserId,
      `รหัสเข้าสู่ระบบ Easy Stamp ของคุณคือ ${code} (ใช้ได้ ${minutes} นาที)\nหากคุณไม่ได้พยายามเข้าสู่ระบบ โปรดอย่าบอกรหัสนี้กับผู้ใด`,
    );
    return { status: "otp_sent" };
  }
}
