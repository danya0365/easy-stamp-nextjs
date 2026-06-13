import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { container } from "@/src/infrastructure/di/container";
import type { User } from "@/src/domain/entities";
import type { Role } from "@/src/domain/types/roles";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "es_session";
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

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

export { COOKIE_NAME };
