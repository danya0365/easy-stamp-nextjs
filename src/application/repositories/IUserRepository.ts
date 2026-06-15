import type { User, UserWithSecret } from "@/src/domain/entities";
import type { Role } from "@/src/domain/types/roles";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: Role;
  shopId?: string | null;
  branchId?: string | null;
}

export interface IUserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  /** Includes the password hash — for login verification only. */
  findByEmailWithSecret(email: string): Promise<UserWithSecret | null>;
  /** Includes the password hash — for verifying the current password on change. */
  findByIdWithSecret(id: string): Promise<UserWithSecret | null>;
  listByShop(shopId: string): Promise<User[]>;
  listByRole(role: Role): Promise<User[]>;
  setActive(id: string, isActive: boolean): Promise<User>;
  updatePassword(id: string, passwordHash: string): Promise<User>;
  /** LINE account linking. */
  setLineUserId(id: string, lineUserId: string | null): Promise<User>;
  setLineLinkCode(
    id: string,
    code: string | null,
    expiresAt: string | null,
  ): Promise<User>;
  /** Returns the user whose UNEXPIRED link code matches, or null. */
  findByLineLinkCode(code: string): Promise<User | null>;
}
