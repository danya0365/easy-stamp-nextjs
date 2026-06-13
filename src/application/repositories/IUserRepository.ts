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
  listByShop(shopId: string): Promise<User[]>;
  setActive(id: string, isActive: boolean): Promise<User>;
}
