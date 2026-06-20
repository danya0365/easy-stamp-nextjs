import "server-only";

import { createHash } from "node:crypto";

import type { IPasswordBreachChecker } from "@/src/application/services/IPasswordBreachChecker";

const RANGE_API = "https://api.pwnedpasswords.com/range/";

/**
 * HaveIBeenPwned "Pwned Passwords" via the k-anonymity range API: only the first
 * 5 hex chars of the SHA-1 are sent — the full password/hash never leaves the
 * server. Fails OPEN (returns false) on any network/parse error so an HIBP outage
 * can't block password changes.
 */
export class HibpPasswordBreachChecker implements IPasswordBreachChecker {
  async isBreached(password: string): Promise<boolean> {
    try {
      const sha1 = createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);
      const res = await fetch(`${RANGE_API}${prefix}`, {
        headers: { "Add-Padding": "true" },
      });
      if (!res.ok) return false;
      const body = await res.text();
      for (const line of body.split("\n")) {
        const [hashSuffix, countStr] = line.trim().split(":");
        if (hashSuffix === suffix) {
          return Number(countStr) > 0;
        }
      }
      return false;
    } catch {
      return false; // fail open
    }
  }
}
