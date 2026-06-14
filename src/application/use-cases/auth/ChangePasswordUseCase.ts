import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";
import { assertValidPassword } from "./password-policy";

/** A logged-in user changes their OWN password (must prove the current one). */
export class ChangePasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users.findByIdWithSecret(userId);
    if (!user) throw new Error("ไม่พบบัญชีผู้ใช้");

    const ok = await this.hasher.compare(currentPassword, user.passwordHash);
    if (!ok) throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");

    assertValidPassword(newPassword);
    if (await this.hasher.compare(newPassword, user.passwordHash)) {
      throw new Error("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม");
    }

    const passwordHash = await this.hasher.hash(newPassword);
    await this.users.updatePassword(userId, passwordHash);
  }
}
