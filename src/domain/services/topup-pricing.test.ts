/**
 * Pure-function tests. No test framework is installed — run with Node's built-in
 * runner via tsx:  npx tsx --test src/domain/services/topup-pricing.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TOPUP_PRESETS,
  DEFAULT_PRICE_PER_DAY_SATANG,
  computeCustomBonusDays,
  resolveTopupQuote,
  computeSavingsPercent,
  computeNewExpiry,
} from "./topup-pricing";
import { computeBillingState } from "./subscription-status";

const RATE = DEFAULT_PRICE_PER_DAY_SATANG; // 1000 satang = ฿10/วัน
const DAY = 864e5;

test("presets resolve to correct total days + fixed price", () => {
  const byId = Object.fromEntries(TOPUP_PRESETS.map((p) => [p.id, p]));
  const q90 = resolveTopupQuote({ packageId: "d90" }, RATE);
  assert.equal(q90.baseDays, 90);
  assert.equal(q90.bonusDays, 7);
  assert.equal(q90.totalDays, 97);
  assert.equal(q90.amountSatang, byId.d90.priceSatang);

  const q365 = resolveTopupQuote({ packageId: "d365" }, RATE);
  assert.equal(q365.totalDays, 410);
  assert.equal(q365.amountSatang, 365000);
});

test("unknown package id throws", () => {
  assert.throws(() => resolveTopupQuote({ packageId: "nope" }, RATE));
});

test("custom bonus tiers at boundaries", () => {
  assert.equal(computeCustomBonusDays(89), 0);
  assert.equal(computeCustomBonusDays(90), 7);
  assert.equal(computeCustomBonusDays(149), 7);
  assert.equal(computeCustomBonusDays(150), 30);
  assert.equal(computeCustomBonusDays(364), 30);
  assert.equal(computeCustomBonusDays(365), 45);
});

test("custom quote prices days * rate and adds tiered bonus", () => {
  const q = resolveTopupQuote({ customDays: 150 }, RATE);
  assert.equal(q.packageId, null);
  assert.equal(q.baseDays, 150);
  assert.equal(q.bonusDays, 30);
  assert.equal(q.totalDays, 180);
  assert.equal(q.amountSatang, 150 * RATE);
});

test("custom days out of range throws", () => {
  assert.throws(() => resolveTopupQuote({ customDays: 0 }, RATE));
  assert.throws(() => resolveTopupQuote({ customDays: 99999 }, RATE));
});

test("savings reflect free bonus days", () => {
  // 180-day preset: total 200 days valued at 200*1000=200000, price 180000 → 10%.
  const q180 = resolveTopupQuote({ packageId: "d180" }, RATE);
  assert.equal(computeSavingsPercent(q180, RATE), 10);
  // 30-day preset: no bonus → 0% savings.
  const q30 = resolveTopupQuote({ packageId: "d30" }, RATE);
  assert.equal(computeSavingsPercent(q30, RATE), 0);
});

test("computeNewExpiry stacks before expiry, restarts after lapse", () => {
  const now = new Date("2026-06-14T00:00:00.000Z");
  // (a) topping up early → extend from the future expiry, not now.
  const future = new Date(now.getTime() + 10 * DAY).toISOString();
  const stacked = computeNewExpiry(future, 30, now);
  assert.equal(stacked, new Date(now.getTime() + 40 * DAY).toISOString());

  // (b) topping up after lapse → start from now.
  const past = new Date(now.getTime() - 5 * DAY).toISOString();
  const restarted = computeNewExpiry(past, 30, now);
  assert.equal(restarted, new Date(now.getTime() + 30 * DAY).toISOString());

  // (c) exactly at expiry → from now.
  const atNow = computeNewExpiry(now.toISOString(), 30, now);
  assert.equal(atNow, new Date(now.getTime() + 30 * DAY).toISOString());
});

test("billing state: pre-expiry nudge, grace, then suspend", () => {
  const now = new Date("2026-06-14T00:00:00.000Z");
  const due = (days: number) =>
    new Date(now.getTime() + days * DAY).toISOString();

  // 8 days left → no nudge yet.
  let s = computeBillingState({ currentPeriodDueAt: due(8) }, now);
  assert.equal(s.state, "active");
  assert.equal(s.preExpiryBannerLevel, 0);
  assert.equal(s.daysUntilDue, 8);

  // 7 days left → first nudge.
  s = computeBillingState({ currentPeriodDueAt: due(7) }, now);
  assert.equal(s.preExpiryBannerLevel, 1);

  // 1 day left → most urgent nudge.
  s = computeBillingState({ currentPeriodDueAt: due(1) }, now);
  assert.equal(s.preExpiryBannerLevel, 7);

  // 1–7 days overdue → dunning banner, not suspended.
  s = computeBillingState({ currentPeriodDueAt: due(-3) }, now);
  assert.equal(s.state, "overdue");
  assert.equal(s.daysOverdue, 3);
  assert.equal(s.isSuspended, false);
  assert.equal(s.bannerLevel, 3);

  // > 7 days overdue → suspended.
  s = computeBillingState({ currentPeriodDueAt: due(-8) }, now);
  assert.equal(s.state, "suspended");
  assert.equal(s.isSuspended, true);
});
