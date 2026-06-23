# Template Readiness Audit & Roadmap

Easy Stamp is being hardened to serve as a **reusable SaaS template** (next clone: "Easy Queue").
This doc tracks what was audited, what's strong, and the prioritized backlog. Update the
checkboxes as items land.

> Verified by reading the code (June 2026). Some earlier automated findings were corrected
> here after manual checks (noted inline).

## Verdict
- **Security is strong** ✅ — better than most early-stage SaaS. See "Already solid" below.
- The real gaps are in **template-ization, ops/observability, data lifecycle, and test depth** —
  not in core security.

## Already solid (don't re-do)
- Auth: bcrypt, custom session (httpOnly/secure/sameSite cookies), role gating
  (`requireRole`/`requireShopAccess`/`requireShopWrite`), TOTP 2FA + single-use recovery codes.
- Brute-force defense: `LoginSecurityService` (account lockout + IP alert), IP rate-limits on
  login & OTP-request, **per-account OTP-verify attempt cap** (`MAX_OTP_ATTEMPTS` in
  `VerifyLoginOtpUseCase`).
- Audit log everywhere (`AuditLogger`, append-only, indexed, survives deletes).
- Webhooks: LINE signature verified with `timingSafeEqual`; cron guarded by `CRON_SECRET`.
- HTTP: HSTS/CSP/X-Frame/Referrer/Permissions headers; conservative CSP.
- Multi-tenant: every query scoped by `shopId`; `dependency-cruiser` + ESLint enforce layering &
  `server-only`; repos can't be imported by components.
- Theming: semantic CSS tokens (cafe/minimal/retro + dark) — fully reusable, zero domain coupling.
- DB: comprehensive indexes, keyset cursor pagination, migrations auto-applied & fail the build.
- Resilience (partial): external calls fail-open with timeouts (LINE 5s, OSM 8s, HIBP, R2 delete).

---

## P0 — generic ops/security (flows into every clone)

- [x] **Boot env validation** — `validateEnv()` in `src/infrastructure/config/env.ts`, run from
  `instrumentation.ts`. Conservative: hard-fails in production only when `TURSO_DATABASE_URL` is
  missing or a `file:` URL (prevents prod silently writing to an ephemeral local DB); warns on
  recommended-missing (CRON_SECRET, PROMPTPAY_TARGET, partial R2/LINE groups).
- [x] **`/api/health`** — `app/api/health/route.ts`: pings DB (`select 1`), returns
  `{ ok, db, version, time }`. For uptime monitors / load balancers.
- [x] **`app/global-error.tsx`** — branded root error boundary (root-layout errors no longer fall
  to Next's default page).
- [x] **2FA-verify rate limit** — `verifyLoginTwoFactorAction` throttled per pending user
  (OTP-verify was already capped per-account, so only 2FA needed it).
- [x] **Cleanup cron** — purges **expired sessions** via `ISessionRepository.deleteExpired`.
  Runs as a job under the single cron dispatcher (below).
- [x] **Single-cron dispatcher** — `app/api/cron/route.ts` + `app/api/cron/jobs.ts`: one
  `vercel.json` schedule (`/api/cron`) runs every enabled job (Hobby tier = 1 cron slot). Each job
  is isolated, toggleable via env (`CRON_LEAD_FOLLOWUPS`, `CRON_CLEANUP` = off/false/0), and
  individually triggerable via `/api/cron?job=<id>`. **Upgrade path:** on a paid plan, add
  `/api/cron?job=<id>` entries to `vercel.json` on separate schedules and disable them from the
  run-all via env.
- [ ] **Error tracking (Sentry/equiv) + structured logging** — currently only `console.error`.
  Deferred: needs an external DSN/account decision.

## P1 — template-ization (do before forking Easy Queue)

- [x] **Central brand/product config** — `src/config/brand.ts` (`name`, `tagline`, `description`,
  `totpIssuer`, `userAgent`) is the single place to rename the product. Wired into layout metadata,
  `AppHeader` (default), page `<title>`s, `AppVersion`, `Logo` alt, manifest, TOTP issuer, OTP/2FA/
  LINE messages, geocoder UA. **Still per-clone (by design):** logo image files under
  `public/icons/*`, the static `app/*-image.alt.txt`, `package.json` "name", and long marketing
  prose in privacy/tutorial pages.
- [ ] **i18n scaffold** — UI text is 100% hardcoded Thai, no message catalog. Introduce `next-intl`
  (or similar) and extract strings in phases. Needed for multi-product/multi-language.
- [ ] **Fork docs** — add `docs/DEPLOYMENT.md` (Vercel/R2/LINE/Turso checklist), `docs/TESTING.md`,
  `docs/EXTENDING.md` (how to add a use case/repo/route). README/ARCHITECTURE/VERSIONING already good.
- [ ] **Separate generic vs domain** — generic infra (auth, billing-topup, notifications, audit,
  rate-limit, storage, theming, impersonation ≈ 40%) is reusable; stamp/shop/lead/customer-binding
  is product-specific. Make the split explicit (folders/package boundary) so a clone keeps the
  generic half and swaps the domain half.

## P2 — before scale (data lifecycle, deeper tests, resilience)

- [ ] **PDPA: data export + account/tenant erase** — only soft-delete (`isActive`) exists today; no
  export or hard-delete of personal data (Thai PDPA).
- [ ] **Action/API-route tests** — 78 server actions + ~8 API routes have no tests (auth, billing,
  LINE webhook). Add integration coverage at the action layer.
- [ ] **Negative tenant-isolation tests** — assert shop A cannot read/write shop B's data; add a
  coverage threshold gate in CI.
- [ ] **Retry / circuit-breaker** — external calls fail-open but never retry; if R2 is down, slip
  upload fails silently. Add bounded retry + degrade messaging.
- [ ] **Backup/DR docs + migration rollback** — document Turso backup/restore (RPO/RTO), add
  down-migration/preview policy. (Turso is managed but undocumented here.)
- [ ] **Mandatory 2FA for `platform_admin`** — admins can impersonate read-write; require 2FA.
- [ ] **File upload magic-byte check** — uploads validate MIME + size only; verify header bytes.
- [ ] **lead-follow-ups cron idempotency** — add `leads.lastNotifiedAt` (migration) so a cron retry
  doesn't double-notify. (Held out of P0 to avoid a schema change.)
- [ ] **Orphaned-file cleanup** — R2 objects of deleted payments/photos aren't reclaimed.

---

## How to use this for a new product (e.g. Easy Queue)
1. Keep the generic half (auth, billing, notifications, audit, rate-limit, storage, theming, ops).
2. Swap the domain half (stamp cards/rewards → queue tickets/positions; shop → venue, etc.).
3. Re-skin via `themes/*.css` + (once built) `src/config/brand.ts`.
4. Work the P1/P2 boxes above that you skipped — they apply to every product.
