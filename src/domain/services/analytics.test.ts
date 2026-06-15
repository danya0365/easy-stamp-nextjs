/**
 * Pure-function tests for analytics helpers.
 * Run: npx tsx --test src/domain/services/analytics.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  bangkokDay,
  rangeToSince,
  buildDailySeries,
  redemptionRate,
  isValidRange,
} from "./analytics";

test("bangkokDay shifts UTC into the Bangkok calendar day", () => {
  // 20:00Z -> 03:00 next day in Bangkok (UTC+7)
  assert.equal(bangkokDay("2026-06-15T20:00:00.000Z"), "2026-06-16");
  assert.equal(bangkokDay("2026-06-15T10:00:00.000Z"), "2026-06-15");
});

test("isValidRange only accepts 7/30/90", () => {
  assert.ok(isValidRange(7) && isValidRange(30) && isValidRange(90));
  assert.ok(!isValidRange(14) && !isValidRange(0) && !isValidRange(365));
});

test("rangeToSince covers N Bangkok days inclusive of today", () => {
  const now = new Date("2026-06-15T03:00:00.000Z"); // 10:00 Bangkok, day = 2026-06-15
  const since = rangeToSince(now, 7);
  // start day should be 2026-06-09 (7 days incl. today), at 00:00 Bangkok = 17:00Z prev day
  assert.equal(bangkokDay(since), "2026-06-09");
  assert.equal(since, new Date("2026-06-09T00:00:00+07:00").toISOString());
});

test("buildDailySeries fills gaps with 0 and stays oldest-first", () => {
  const since = "2026-06-09T00:00:00+07:00";
  const now = "2026-06-11T05:00:00.000Z"; // 2026-06-11 Bangkok
  const series = buildDailySeries(
    since,
    now,
    [{ day: "2026-06-09", value: 5 }, { day: "2026-06-11", value: 3 }],
    [{ day: "2026-06-10", value: 2 }],
  );
  assert.deepEqual(
    series.map((p) => [p.day, p.stamps, p.redemptions]),
    [
      ["2026-06-09", 5, 0],
      ["2026-06-10", 0, 2],
      ["2026-06-11", 3, 0],
    ],
  );
});

test("buildDailySeries: single-day range yields one bucket", () => {
  const since = "2026-06-15T00:00:00+07:00";
  const now = "2026-06-15T08:00:00.000Z"; // still 2026-06-15 Bangkok
  const series = buildDailySeries(since, now, [{ day: "2026-06-15", value: 9 }], []);
  assert.equal(series.length, 1);
  assert.deepEqual(series[0], { day: "2026-06-15", stamps: 9, redemptions: 0 });
});

test("redemptionRate is /0-safe and rounded", () => {
  assert.equal(redemptionRate(0, 0), 0);
  assert.equal(redemptionRate(3, 0), 0);
  assert.equal(redemptionRate(1, 3), 33);
  assert.equal(redemptionRate(5, 10), 50);
});
