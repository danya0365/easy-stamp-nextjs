# MEMORY_CONTEXT — Easy Stamp

> Context primer for a fresh session. Reflects the **actual** repo state (scanned, not assumed).
> Version `1.1.0` · UI ภาษาไทย · last scanned 2026-06-15.

> ⚠️ **Correction to a common assumption:** Easy Stamp does **NOT** use Supabase or Postgres RLS.
> It uses **Turso / libSQL (SQLite) + Drizzle ORM** with **custom session auth**. Multi-tenant
> isolation is enforced in the **application layer** (every query scoped by `shopId` + role checks),
> not by row-level security. Routing is **path-based** via Next.js App Router route groups.

---

## 1. Project Overview
**Easy Stamp** = a multi-tenant **digital stamp-card loyalty SaaS** for SME merchants (cafés, bakeries,
salons…) running one or several shops/branches.
- Customers earn stamps per purchase → reach a per-type threshold → redeem a free reward.
- **No app install, no customer login**: a customer's identity is a **device-bound secret token**
  set by scanning the shop's one-time QR (cookie persists ~1 year). Switch device → re-bind at shop.
- Each shop pays via **prepaid "day top-up"** (PromptPay slip → admin verifies → days added).
- Target users: **Thai SME shops**; three operator roles (platform admin / shop owner / branch staff).
- In-app product overview lives at route **`/info`**.

## 2. Tech Stack (from package.json)
- **Next.js 16.2.9** (App Router, Server Actions, Server Components, Turbopack; uses `proxy.ts` **not** `middleware.ts`; async `params`/`searchParams`/`cookies()`)
- **React 19.2.4**
- **Turso / libSQL** (`@libsql/client` 0.17) + **Drizzle ORM 0.45** (`dialect:"turso"`, `snake_case`), **drizzle-kit 0.31**
- **Custom session auth** — `bcryptjs` + httpOnly cookie (`es_session`) + `sessions` table (no NextAuth)
- **Tailwind CSS v4** (multi-theme via CSS vars), **lucide-react** icons, custom UI components (no shadcn)
- **zod** (validation), **react-hook-form** (login), **zustand** (client stores)
- **maplibre-gl / react-map-gl** (shop map), **qrcode** + **qr-scanner** (QR), **browser-image-compression** (slip upload), **dayjs**
- Slip storage: **Cloudflare R2** (S3-compatible via `@aws-sdk/client-s3`); local FS fallback in dev
- Messaging: **LINE Messaging API** (push); LINE OA webhook for account linking
- Hosting: **Vercel** (migrations auto-applied on production build via `scripts/vercel-migrate.mjs`)
- TypeScript 5, ESLint 9. Tests: ad-hoc `node:test` via `tsx --test` (no CI runner found — *to confirm*).

**Key env vars:** `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `SESSION_COOKIE_NAME`, `APP_URL`,
`PROMPTPAY_TARGET`, `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `NEXT_PUBLIC_LINE_OA_ADD_URL`,
`R2_ACCOUNT_ID`/`R2_BUCKET`/`R2_ENDPOINT`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`,
`NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_COMMIT_SHA`, `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`/`SEED_DEMO_OWNER_PASSWORD`.

## 3. Current State
**Shipped & working (in code; Phase 1–2 released as v1.0.0, Phase 3–4 in `[Unreleased]`):**
- ✅ Customer stamp flow (QR bind, device token, `/me` multi-shop card, PWA icon)
- ✅ Staff counter: add stamps / redeem rewards by scanning customer QR; full ledger
- ✅ Multi-tenant + branches + 3 roles (custom session auth)
- ✅ Reward redemption + history (shop & customer views)
- ✅ Prepaid **day top-up** billing: PromptPay slip upload → admin verify/approve/reject; auto-suspend from due date (no cron); preset packages priced by each shop's per-day rate
- ✅ Public shop **map** (maplibre) + "current location"
- ✅ **In-app notifications** (bell + inbox) + **LINE OA push** (env-gated) + shop→admin **contact** channel
- ✅ Bottom tab bar nav (all sizes) + version/commit footer
- ✅ **Multiple stamp types per shop** (price tiers, per-type threshold/reward/balance) — migration 0005
- ✅ **Cursor "load more" pagination** on high-volume lists — migration 0006
- ✅ **Passwordless login via LINE OTP** (email → OTP in LINE → verify; password fallback) — migration 0007
- ✅ Small polish: shared `<Textarea>`, deduped date formatters, loading skeletons, consistent labels/ellipsis

**Pending / not done (to confirm before relying on):**
- ⏳ Phase 3/4 + LINE OTP are committed but **not yet released** — CHANGELOG `[1.1.0]`=Phase 3, `[Unreleased]`=Phase 4 (pagination, OTP, topup UI). Next release = v1.2.0 (`npm run release:minor`).
- ⏳ LINE/email **payment reminders** (deferred "Phase 5/B") and **referral** program (deferred "Phase 7/C")
- ⏳ **Analytics dashboard** — only basic stat tiles exist; no charts/insights
- ⏳ Automated test coverage is partial (pure-logic unit tests only; server actions/e2e not automated)

**Recently fixed (2026-06-15):** CHANGELOG reconciled with the v1.1.0 tag; README billing section corrected (monthly → prepaid day top-up); top-up ledger now surfaced on the billing page ("ประวัติวันใช้งานที่ได้รับ").

## 4. Architecture Decisions
- **Clean layered architecture:** `domain` (entities/services) → `application` (repository *interfaces* + use cases + service ports) → `infrastructure` (Drizzle repos, auth, DI, external services) → `presentation` (server actions, components). Dependencies point inward.
- **DI container** (`src/infrastructure/di/container.ts`): singleton repos/services cached on `globalThis`; swap an implementation in one place (e.g. `IPaymentVerifier`, `IMessagePusher`, slip storage).
- **Multi-tenant strategy:** **application-layer scoping**, not DB RLS. Every repo query filters by `shopId`; `requireRole()` + session gate routes. Roles: `platform_admin` (no shop), `shop_owner` (shopId), `branch_staff` (shopId+branchId).
- **Routing:** path-based **route groups** — `(auth)` login, `(public)` customer/marketing (`/`, `/me`, `/s/[slug]`, `/info`, `/privacy`), `(shop)` owner area, `(staff)` counter, `(platform)` admin. Customer card is per-shop slug: `/s/[slug]`.
- **Auth:** custom — bcrypt password **or** LINE OTP → `sessions` row → httpOnly cookie; `proxy.ts` for edge gating.
- **Migrations:** Drizzle SQL files in `drizzle/` (0000–0007). **Additive-first** policy (new tables / `ADD COLUMN`, avoid SQLite table rebuilds). Prod auto-runs `db:migrate` during Vercel build; local uses `db:push`. ⚠️ drizzle-kit defaults to **remote prod** Turso (loads `.env.production.local`) — override env inline for local.
- **Billing model:** prepaid **day top-up** (replaced monthly subscription). `subscriptions.pricePerDaySatang` is source of truth; `amountSatang` is vestigial. Suspension derived from `currentPeriodDueAt`.
- **Stamp model (post-Phase 3):** `stamp_cards` is just the per-(shop,customer) **anchor**; live balances live in `stamp_balances` (per `stampTypeId`). `shops.stampThreshold`/`rewardText` are vestigial (source of truth = the shop's `isDefault` stamp type).
- **Versioning:** SemVer, single source = `package.json` `version` → footer. Release via `npm run release:patch|minor|major` + CHANGELOG (see `VERSIONING.md`).

## 5. Data Model (Turso/SQLite, ids = nanoid, timestamps = ISO strings)
Reference/auth:
- **shop_categories** (reference) ← `shops.categoryId`
- **users** (`role`, `shopId?`, `branchId?`, `isActive`, `lineUserId?`, `loginOtp*`) — 1—* **sessions**

Tenant core (all scoped by `shopId`):
- **shops** 1—* **branches**, 1—* **users**, 1—* **customers**, 1—* **stamp_types**, 1—1 **subscriptions**, 1—* **payments**, 1—* **topup_transactions**, 1—* **stamp_transactions**, 1—* **reward_redemptions**, 1—* **contact_requests**
- **customers** (per shop, keyed by phone; `publicCode` for QR) — 1—1 **stamp_cards** (anchor)
  - **customer_devices** (device token ↔ customer binding) · **bind_codes** (one-time QR link, expiry)
- **stamp_cards** 1—* **stamp_balances** (one per `stampTypeId` → `currentStamps`/`lifetimeStamps`/`rewardsEarned`)
- **stamp_types** (per shop, multiple; `threshold`, `rewardText`, `priceSatang?`, `isDefault`, `sortOrder`)
- **stamp_transactions** (ledger: `earn`/`redeem_adjust`, `quantity`, `stampTypeId?`) · **reward_redemptions** (`rewardTextSnapshot`, `stampsSpent`, `stampTypeId?`)

Billing:
- **subscriptions** (`pricePerDaySatang`, `currentPeriodDueAt` = paid-through) — 1—* **payments** (slip, `daysToAdd`+`bonusDays`, status pending/approved/rejected) → **topup_transactions** (ledger of days added)

Comms:
- **notifications** (per user; type, read state) · **contact_requests** (shop→admin; open/resolved)

*(Full column detail: `src/infrastructure/db/schema/*.ts` and `src/domain/entities/index.ts`.)*

## 6. Phased Rollout Plan
Philosophy: **ง่ายก่อน ค่อยเพิ่มทีหลัง** — every phase is independently shippable. Phases 1–4 are
**already done** (documented here retrospectively); Phase 5+ are **proposed next**.

### ✅ Phase 1 — MVP: stamp flow (DONE)
- **Goal:** a shop runs a single stamp card; customers collect stamps via a link/QR, no login.
- **Features:** device-token customer identity, QR bind, staff add-stamp counter, per-shop threshold/reward, ledger, 3 roles, basic shop setup.
- **Not in phase:** redemption history, multi stamp types, billing UI, notifications.

### ✅ Phase 2 — Redeem + history + billing + comms (DONE, released v1.0.0)
- **Goal:** complete the loyalty loop and make the platform sellable.
- **Features:** reward redemption + history (shop & customer), day-top-up billing (PromptPay slip → admin verify, auto-suspend), shop map + geolocation, in-app notifications + LINE OA push, shop→admin contact, bottom-tab nav, version footer, loading skeletons.
- **Not in phase:** multiple stamp types, pagination, passwordless login, analytics.

### ✅ Phase 3 — Multiple stamp types per shop (DONE)
- **Goal:** a shop tracks several stamp tracks (e.g. by price tier 10/20/30฿), each with its own threshold + reward.
- **Features:** `stamp_types` + `stamp_balances`, per-type progress UI, staff picks type when stamping, migration 0005 (additive + backfill).
- **Not in phase:** cross-type promotions, type-level analytics.

### ✅ Phase 4 — Polish: pagination + passwordless login (DONE)
- **Goal:** scale the UX and harden login.
- **Features:** app-wide cursor "load more" on big lists (migration 0006 indexes), LINE-OTP passwordless login with password fallback (migration 0007), shared UI primitives, consistent copy.
- **Not in phase:** reminders, referrals, analytics.

### 🔜 Phase 5 — Billing reminders & retention (proposed)
- **Goal:** reduce churn from expiry; close the billing loop automatically.
- **Features:** scheduled LINE/email reminders before/after due date (escalating), in-app banner, optional auto-receipt; "reactivate" CTA on suspension.
- **Not in phase:** auto-charge/recurring payments, referrals.

### 🔜 Phase 6 — Shop analytics dashboard (proposed)
- **Goal:** give owners insight beyond raw counts.
- **Features:** stamps/redemptions over time, active customers, redemption rate, per-type & per-branch breakdown, top-up history UI (surface `topup_transactions`).
- **Not in phase:** cross-shop platform analytics, exports.

### 🔜 Phase 7 — Growth: referrals & deeper LINE (proposed)
- **Goal:** customer acquisition + richer engagement.
- **Features:** referral program, LINE rich menu / LIFF card view, broadcast promos, birthday/inactive win-back.
- **Not in phase:** marketplace, payments beyond PromptPay.

## 7. Next Immediate Steps
1. **Commit the pending work + release v1.2.0** — Phase 4 (pagination), LINE OTP login, top-up ledger UI, and these docs are uncommitted. Commit per-feature (keep the clean history), then `npm run release:minor` (CHANGELOG `[Unreleased]` is ready).
2. **Manual prod test of LINE OTP login** end-to-end (link LINE → email → OTP → verify + password fallback); confirm migration 0007 applied on prod.
3. **Phase 5 (reminders) — decide the scheduling mechanism first.** LINE/email reminders need a trigger; suspension today is derived on-visit with no cron. Recommended: **Vercel Cron** hitting a protected route that pushes due-soon/overdue reminders via `IMessagePusher`. Needs a decision before building.
4. **Phase 6 (analytics dashboard)** — charts for stamps/redemptions over time, active customers, redemption rate, per-type/branch breakdown.
