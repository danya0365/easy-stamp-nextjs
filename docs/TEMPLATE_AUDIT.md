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
  is isolated, toggleable via env (`CRON_LEAD_FOLLOWUPS`, `CRON_CLEANUP`, `CRON_ORPHANED_FILES` =
  off/false/0), and
  individually triggerable via `/api/cron?job=<id>`. **Upgrade path:** on a paid plan, add
  `/api/cron?job=<id>` entries to `vercel.json` on separate schedules and disable them from the
  run-all via env.
- [x] **Error tracking + structured logging** — vendor-neutral `ILogger`
  (`src/application/services/ILogger.ts`) with a structured impl
  (`src/infrastructure/observability/logger.ts`): JSON lines in production, a compact human line in
  dev, `LOG_LEVEL`/`LOG_FORMAT` gated, unit-tested. All server-side `console.*` now route through it
  (infra services, cron + LINE-webhook routes, env boot warnings, audit/notification swallow-paths);
  `captureException` also forwards to a pluggable `ErrorTracker` — a no-op until `ERROR_WEBHOOK_URL`
  is set (then it POSTs a JSON report, fail-soft), env-gated like R2/LINE and swappable for a full
  APM (Sentry) without touching call sites. **Client errors covered too:** the two error boundaries
  (`app/error.tsx`, `app/global-error.tsx`) beacon to `POST /api/client-error` via
  `reportClientError` (keepalive fetch, fail-soft), which forwards to the same logger/tracker; the
  route is per-IP rate-limited + payload-clamped and integration-tested. (They also keep
  `console.error` for the browser devtools in local dev.)

## P1 — template-ization (do before forking Easy Queue)

- [x] **Central brand/product config** — `src/config/brand.ts` (`name`, `tagline`, `description`,
  `totpIssuer`, `userAgent`) is the single place to rename the product. Wired into layout metadata,
  `AppHeader` (default), page `<title>`s, `AppVersion`, `Logo` alt, manifest, TOTP issuer, OTP/2FA/
  LINE messages, geocoder UA. **Still per-clone (by design):** logo image files under
  `public/icons/*`, the static `app/*-image.alt.txt`, `package.json` "name", and long marketing
  prose in privacy/tutorial pages.
- [~] **i18n scaffold (done; string migration is ongoing)** — `next-intl` v4 wired in the
  **no-routing** single-locale (`th`) mode: `next.config.ts` plugin → `src/i18n/request.ts` →
  `messages/th.json` (+ `en.json` placeholder), `NextIntlClientProvider` in the root layout, and
  type-safe keys via `global.d.ts`. Pilot-migrated `app/not-found.tsx` (server: `getTranslations`)
  and `app/error.tsx` (client: `useTranslations`). **Client bundle is scoped** — only namespaces in
  `src/i18n/client-messages.ts` reach the browser; server components translate via `getTranslations`
  at zero client cost (per Next's i18n guide). **First app slice migrated:** the shared-UI
  components into an expanded `common` namespace (`LoadMore`, `ConfirmDialog`, `ImageCropField`) and
  the login surface into a new `auth` namespace (`LoginForm` incl. an ICU rich-text line, `DeviceList`,
  `ChangePasswordForm`); `auth` added to the `client-messages.ts` allowlist. **Second slice:** the
  client billing components into a `billing` namespace (`TopupForm` — heavy ICU interpolation for
  days/percent/amounts — plus `PaymentHistoryList`, `TopupHistoryList`, `ResumeShopButton`); `billing`
  added to the allowlist. The billing **server** components are migrated too (`PromptPayQR` +
  `SuspensionBanner`/`PreExpiryBanner`/`PausedBanner` — converted to async server components using
  `getTranslations` + `t.rich` for the `<strong>` banner copy), so the whole **billing area is now
  done**. **Shop area done:** the entire `src/presentation/components/shop/` tree is migrated into a
  `shop` namespace — dashboard (FeatureGrid/FeatureCarousel/OnboardingSuggestions), stamp/pause
  settings, images/profile, customer list, QR poster, staff/branch forms, contact-admin, and the
  public display components (ShopHero/ShopGallery/ShopDirectoryCard/ShopDetails, converted to async
  server components). `shop` is in the client allowlist. **Admin area done too:** the entire
  `src/presentation/components/admin/` tree is migrated into an `admin` namespace (audit timeline,
  shop/payment/2FA controls, create-shop + credentials-handoff forms, contact inbox, impersonation
  banner). **Remaining (incremental):** inline strings still living in `app/**` page files (headings,
  empty states) and a few smaller component areas (notifications/reviews/leads) — migrate as touched. (Leave inline: use-case/action `{ error }`
  strings, audit text, and `app/global-error.tsx` — it replaces the root layout/provider.)
- [x] **Fork docs** — `docs/DEPLOYMENT.md` (Vercel/R2/LINE/Turso checklist + env + cron),
  `docs/TESTING.md` (runner/in-memory DB/helpers/e2e), `docs/EXTENDING.md` (add an
  entity/repo/use-case/action + the enforced rules). Indexed from the README.
- [x] **Separate generic vs domain** — documented as a boundary map in
  [REUSE_MAP.md](REUSE_MAP.md) (every module classified 🟢 keep / 🟡 configure / 🔴 rewrite + a fork
  procedure). Physical folder split deliberately deferred — a bulk move would churn imports repo-wide
  for little gain; the map is the practical fork checklist. (Optional later: a dependency-cruiser
  rule flagging generic→domain imports, once the container/shells are untangled.)

## P2 — before scale (data lifecycle, deeper tests, resilience)

- [x] **PDPA: data export + erase** — **export** (admin-assisted): a shop owner downloads a
  customer's full data as JSON via `GET /api/shop/customers/[customerId]/data-export`
  (`ExportCustomerDataUseCase`, shop-scoped). **Erase** via **anonymize**
  (`AnonymizeCustomerUseCase` + `anonymizeCustomerAction`): strips PII (phone/name/QR code, synthetic
  per-customer unique values keep the constraints) and drops device bindings, keeping
  cards/balances/transactions so the shop's aggregates/financials stay consistent. Irreversible,
  shop-scoped, audited (`customer_erased`). Both wired into the customer-list row actions.
- [~] **Action/API-route tests** — money path covered: `billing-flow.integration.test.ts` (approve
  credits exact days + ledger; double-verify guarded; reject doesn't extend). **Session/cookie
  mocking solved** — `shop-actions.integration.test.ts` drives real server actions end-to-end by
  stubbing `next/headers`·`next/cache`·`next/navigation` with `mock.module` (runner now passes
  `--experimental-test-module-mocks`) and seeding a real session row; covers the auth matrix
  (owner / cross-shop / admin-impersonation w/ audit accountability / admin-without-impersonation /
  unauthenticated). Pattern documented in TESTING.md. **Now covered:** the **LINE webhook**
  (`app/api/line/webhook/route.test.ts` — HMAC signature, link-code success/lowercase/unknown,
  non-code chat, already-bound conflict, follow event; the test also surfaced + fixed a bug where the
  "already linked elsewhere" reply never fired because the UNIQUE error text is on the drizzle error's
  `cause` chain, not `message`) and the **auth server actions**
  (`auth-actions.integration.test.ts` — login / OTP / 2FA verify + setup / rate-limit / password
  change / dev-login guard). **Remaining (optional):** more shop/admin actions as touched.
- [x] **Negative tenant-isolation tests** — `tenant-isolation.integration.test.ts` asserts shop B
  can't see shop A's customers/cards/ledgers/reviews (4 cases). ⏳ **Coverage gate still deferred** —
  Node 20 `node:test` has no threshold flags (Node 22+); enforce via Node 22 `--test-coverage-lines`
  or `c8 --check-coverage` later (see TESTING.md).
- [x] **Retry for external calls** — generic `retry()` helper (`src/infrastructure/services/retry.ts`,
  unit-tested) applied to the LINE push `fetch`, the OSM geocoder (`OsmGeocoder.fetchJson`), and the
  HIBP breach check (`HibpPasswordBreachChecker`, tested). All retry network/timeout + 5xx/429 and
  treat 4xx as permanent; OSM/HIBP stay fail-soft (null / fail-open). R2/S3 already retries transient
  errors via the AWS SDK (verified — not double-wrapped). **Optional later:** retry the Turnstile
  verify; a real circuit-breaker if external flakiness becomes a problem.
- [x] **Backup/DR docs + migration rollback** — documented in [DEPLOYMENT.md](DEPLOYMENT.md) §6: Turso
  dump/restore + restore drill + RPO/RTO, R2 versioning, and the forward-only migration revert policy
  (ship a new migration; snapshot before risky/destructive changes).
- [x] **Mandatory 2FA for `platform_admin`** — already enforced: `MandatoryTwoFactorGate` renders in
  place of all admin content until the admin enrolls 2FA (`app/(platform)/layout.tsx`); DEV bypass only.
- [x] **File upload magic-byte check** — `src/domain/services/image-signature.ts` (`sniffImageType`/
  `isSupportedImage`) verifies real PNG/JPEG/WEBP/HEIC headers; wired into the shop-image, payment-slip,
  and lead-photo upload use cases (rejects disguised html/js/svg/pdf renamed as images). Unit-tested.
- [x] **lead-follow-ups cron idempotency** — `leads.follow_up_notified_at` (migration 0017) stamps the
  reminder *after* a successful notify; `listDueFollowUps` skips leads whose stamp is ≥ the current
  `nextFollowUpAt`, so a cron retry can't double-notify and rescheduling re-arms the reminder
  (at-least-once, announced once per due date).
- [x] **Orphaned-file cleanup** — `CleanOrphanedFilesUseCase` (cron job `orphaned-files`,
  `CRON_ORPHANED_FILES`) lists every blob under the managed prefixes (`slips/`, `leads/`, `shops/`)
  via `ISlipStorage.list` and deletes those not referenced by any DB row
  (payments/leads/shop_images keys). Fails closed (reference set gathered up front) and spares files
  newer than a 24h grace window so it can't race in-flight uploads.

---

## How to use this for a new product (e.g. Easy Queue)
1. Keep the generic half (auth, billing, notifications, audit, rate-limit, storage, theming, ops).
2. Swap the domain half (stamp cards/rewards → queue tickets/positions; shop → venue, etc.).
3. Re-skin via `themes/*.css` + (once built) `src/config/brand.ts`.
4. Work the P1/P2 boxes above that you skipped — they apply to every product.
