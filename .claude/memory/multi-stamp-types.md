---
name: multi-stamp-types
description: Phase 3 — shops support multiple stamp types (per-type threshold/reward/balance); migration 0005; data model + legacy notes
metadata: 
  node_type: memory
  type: project
  originSessionId: add8da62-4407-485f-ab53-38217a9b99d4
---

Phase 3 (shipped 2026-06-15): a shop can define **multiple stamp types** (e.g. price tiers), each tracked separately with its own threshold + reward.

- **New tables:** `stamp_types` (per shop: name, threshold, rewardText, priceSatang nullable, isActive, isDefault, sortOrder) and `stamp_balances` (per cardId+stampTypeId: currentStamps/lifetimeStamps/rewardsEarned, unique(cardId,stampTypeId)). `stamp_transactions` + `reward_redemptions` got a nullable `stampTypeId`.
- **`stamp_cards` is now just the per-(shop,customer) identity anchor** — its currentStamps/lifetimeStamps/rewardsEarned columns are **legacy/frozen** (not read; live balances live in `stamp_balances`). `shops.stampThreshold`/`rewardText` are **vestigial** (source of truth = the shop's isDefault stamp type).
- **Migration `drizzle/0005_warm_avengers.sql`** is additive (no table rebuild) + hand-added idempotent data backfill: one default type per shop from shop.stampThreshold/rewardText, a balance per existing card, backfill stampTypeId on tx/redemptions. Prod auto-applies on deploy ([scripts/vercel-migrate.mjs](scripts/vercel-migrate.mjs)). Local was tested via `sqlite3 copy < 0005.sql` (counts: types==shops, balances==cards). See [[drizzle-kit-targets-prod]].
- **Domain:** `CustomerCardView` is now `{ customer, types: StampTypeProgress[] }` (multi). `buildCardView(types, customer, balances)` in [card-view.ts](src/domain/services/card-view.ts). Read use cases use `loadCardView` helper. Add/Redeem use cases take `stampTypeId`. New repos: `IStampTypeRepository`, `IStampBalanceRepository`.
- **UI:** shop settings = `StampTypesManager` (CRUD); StampStation has a type picker + per-type redeem buttons; CardBalance/me/s render one section per type. Guard: a shop must keep ≥1 active type; default type can't be deactivated (toggle hidden).
- **Untested by automation:** the add/redeem server-action mutation (tsx can't resolve `@/` alias; action protocol hard to curl) — covered by tsc + unit-tested view math + proven repo patterns. Manual click-test recommended in dev.
