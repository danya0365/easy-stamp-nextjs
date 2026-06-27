---
name: billing-daytopup-phases
description: "Billing switched to prepaid day-topup; Phase A shipped, Phase B (LINE/email reminders) and C (referral) deferred"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6f74b9ab-8cdb-48c2-8561-0406c5a89dd2
---

Billing was migrated from fixed monthly subscription → **prepaid "day top-up"** model (2026-06-14).

**Phase A (DONE):** `subscriptions.currentPeriodDueAt` is now the shop's expiry/paid-through date. Topping up extends it. Pure pricing in `src/domain/services/topup-pricing.ts` (presets d30/d90/d180/d365 with bonus days + custom-day tiered bonus + `computeNewExpiry` stacking). New `topup_transactions` ledger table. New shops get a **30-day trial**. `subscriptions.amountSatang` is now vestigial (default 0); per-day rate is `pricePerDaySatang` (default 1000 = ฿10/วัน). Pre-expiry nudge banner + post-expiry SuspensionBanner reuse `computeBillingState` (`GRACE_DAYS=7`). Packages are a config constant, not a DB table. Migration: `drizzle/0002_living_dragon_man.sql`.

**Phase B (DEFERRED):** LINE/email reminders before+after expiry. Needs an `INotifier` interface + LINE Messaging API / email adapter, storing owner LINE userId/email, and a daily cron job scanning shops where `daysUntilDue ≤ 7` or overdue. Provider + cron mechanism still need to be chosen with the owner.

**Phase C (DEFERRED):** Referral — per-shop referral code + `referrals` table; granting free days to both sides via a `topup_transactions` row of type `"adjustment"`.

Full plan: `~/.claude/plans/partitioned-sparking-liskov.md`. See [[project-easy-stamp]], [[drizzle-kit-targets-prod]].
