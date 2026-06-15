import { customAlphabet } from "nanoid";

import type { IUserRepository } from "@/src/application/repositories/IUserRepository";

// Unambiguous code (no 0/O/1/I) so it's easy to type into the LINE chat.
const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

/** Generate (and store) a one-time code the operator sends in LINE chat to link. */
export class GenerateLineLinkCodeUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<string> {
    const code = makeCode();
    await this.users.setLineLinkCode(userId, code);
    return code;
  }
}
