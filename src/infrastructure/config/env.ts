import "server-only";

/** True in any production build (local `next start`, Vercel preview & prod). */
export const isProd = process.env.NODE_ENV === "production";

/**
 * Gate for DEV-ONLY conveniences that must NEVER reach a hosted environment —
 * most importantly the password-less login switcher.
 *
 * Enabled only on a developer's local machine:
 *   - NODE_ENV !== "production"  → excludes local prod builds (`next start`)
 *   - !process.env.VERCEL        → excludes ALL Vercel deployments (preview AND
 *                                  production both set NODE_ENV=production, but
 *                                  this is belt-and-suspenders: even a misconfig
 *                                  can't expose it on Vercel)
 *
 * Gate every dev-only surface AND its server action with this single flag.
 */
export const isDevLoginEnabled =
  process.env.NODE_ENV !== "production" && !process.env.VERCEL;
