import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort client IP for rate-limiting/abuse logging. On Vercel the real IP
 * is the first entry of x-forwarded-for. Falls back to "unknown" (callers should
 * treat "unknown" as a shared bucket — still rate-limited, just coarser).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}
