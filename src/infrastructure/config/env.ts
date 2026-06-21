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

/**
 * DEV-ONLY 2FA bypass — skips the mandatory-2FA gate and the login TOTP
 * challenge so local testing isn't blocked by an authenticator code.
 *
 * Triple-gated and OPT-IN (off unless explicitly set):
 *   - NODE_ENV !== "production"      → excludes local prod builds
 *   - !process.env.VERCEL           → excludes ALL Vercel deployments
 *   - DEV_DISABLE_2FA === "true"     → must be set on purpose in .env.local
 *
 * NEVER weakens 2FA in any hosted environment, even if the var leaks.
 */
export const is2faBypassed =
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL &&
  process.env.DEV_DISABLE_2FA === "true";
