import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { container } from "@/src/infrastructure/di/container";
import { isProd } from "@/src/infrastructure/config/env";
import type { KnownAccount, User } from "@/src/domain/entities";
import type { Role } from "@/src/domain/types/roles";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "es_session";
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

// FB-style "accounts used on this device" — remembered emails (+role) so the
// login page can offer one-tap account selection. Holds NO credentials/session;
// httpOnly so the list isn't readable by client JS. Picking one still requires
// full OTP/password auth.
const ACCOUNTS_COOKIE = "es_accounts";
const ACCOUNTS_MAX = 5;
const ACCOUNTS_TTL_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Read and validate the current session. Returns the authenticated user, or
 * null when there is no valid session. This is the real authorization layer
 * (proxy.ts only does an optimistic cookie-presence check).
 */
export async function getSession(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const result = await container.sessionRepository.findValid(token, new Date());
  return result?.user ?? null;
}

/**
 * Require an authenticated user with one of the given roles. Redirects to
 * /login when unauthenticated, or to its role home when the role mismatches.
 * Call at the top of every protected layout/page and inside every action.
 */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (roles.length > 0 && !roles.includes(user.role)) {
    redirect("/login");
  }
  return user;
}

/** Assert the user owns the given shop (platform_admin bypasses). */
export function requireShopScope(user: User, shopId: string): void {
  if (user.role === "platform_admin") return;
  if (user.shopId !== shopId) {
    throw new Error("Forbidden: shop scope mismatch");
  }
}

/** Assert a branch_staff is acting within their own branch. */
export function requireBranchScope(user: User, branchId: string): void {
  if (user.role === "platform_admin" || user.role === "shop_owner") return;
  if (user.branchId !== branchId) {
    throw new Error("Forbidden: branch scope mismatch");
  }
}

/** Create a session row and set the httpOnly cookie. Server Actions only. */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const session = await container.sessionRepository.create({
    userId,
    expiresAt: expiresAt.toISOString(),
  });
  (await cookies()).set(COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Delete the current session row and clear the cookie. Server Actions only. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await container.sessionRepository.delete(token);
    store.delete(COOKIE_NAME);
  }
}

function parseAccounts(raw: string | undefined): KnownAccount[] {
  if (!raw) return [];
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (a): a is KnownAccount =>
          !!a &&
          typeof (a as KnownAccount).email === "string" &&
          typeof (a as KnownAccount).role === "string",
      )
      .slice(0, ACCOUNTS_MAX);
  } catch {
    return [];
  }
}

function writeAccounts(
  store: Awaited<ReturnType<typeof cookies>>,
  accounts: KnownAccount[],
): void {
  if (accounts.length === 0) {
    store.delete(ACCOUNTS_COOKIE);
    return;
  }
  store.set(ACCOUNTS_COOKIE, JSON.stringify(accounts), {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + ACCOUNTS_TTL_MS),
  });
}

/** Accounts previously used to sign in on this device, most-recent first. */
export async function getKnownAccounts(): Promise<KnownAccount[]> {
  const store = await cookies();
  return parseAccounts(store.get(ACCOUNTS_COOKIE)?.value);
}

/** Record a successful sign-in so it can be offered next time (most-recent first). */
export async function rememberAccount(account: KnownAccount): Promise<void> {
  const store = await cookies();
  const existing = parseAccounts(store.get(ACCOUNTS_COOKIE)?.value);
  const next = [
    account,
    ...existing.filter((a) => a.email !== account.email),
  ].slice(0, ACCOUNTS_MAX);
  writeAccounts(store, next);
}

/** Remove one remembered account from this device. */
export async function forgetAccount(email: string): Promise<void> {
  const store = await cookies();
  const next = parseAccounts(store.get(ACCOUNTS_COOKIE)?.value).filter(
    (a) => a.email !== email,
  );
  writeAccounts(store, next);
}

export { COOKIE_NAME };
