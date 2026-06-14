import type { User } from "@/src/domain/entities";
import type { IUserRepository } from "@/src/application/repositories/IUserRepository";
import type { IPasswordHasher } from "@/src/application/services/IPasswordHasher";
import { assertValidPassword } from "./password-policy";

/**
 * A privileged user sets a NEW password for someone else (no current password
 * needed). Authorization (who may reset whom) is enforced by the caller.
 */
export class ResetPasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(targetUserId: string, newPassword: string): Promise<User> {
    assertValidPassword(newPassword);
    const passwordHash = await this.hasher.hash(newPassword);
    return this.users.updatePassword(targetUserId, passwordHash);
  }
}
