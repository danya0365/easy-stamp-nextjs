import { customAlphabet } from "nanoid";

import type { IUserRepository } from "@/src/application/repositories/IUserRepository";

// Unambiguous code (no 0/O/1/I) so it's easy to type into the LINE chat.
export const LINE_LINK_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LINE_LINK_CODE_LENGTH = 6;
const makeCode = customAlphabet(LINE_LINK_CODE_ALPHABET, LINE_LINK_CODE_LENGTH);

const CODE_SHAPE = new RegExp(
  `^[${LINE_LINK_CODE_ALPHABET}]{${LINE_LINK_CODE_LENGTH}}$`,
);

/**
 * True when a (trimmed, upper-cased) string looks like a link code. The LINE
 * webhook uses this to tell a link attempt apart from ordinary chat, so general
 * customer messages don't get a "code not found" reply.
 */
export function isLineLinkCodeShape(text: string): boolean {
  return CODE_SHAPE.test(text);
}

/** Generate (and store) a one-time code the operator sends in LINE chat to link. */
export class GenerateLineLinkCodeUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string): Promise<string> {
    const code = makeCode();
    await this.users.setLineLinkCode(userId, code);
    return code;
  }
}
