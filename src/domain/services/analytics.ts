import type { AnalyticsDailyPoint, DailyBucket } from "../entities";

/** Allowed dashboard ranges, in days. */
export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];
export const DEFAULT_RANGE: RangeDays = 30;

export function isValidRange(n: number): n is RangeDays {
  return (RANGE_OPTIONS as readonly number[]).includes(n);
}

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** The Bangkok calendar day ("YYYY-MM-DD") an instant falls on. */
export function bangkokDay(iso: string | Date): string {
  const ms = (iso instanceof Date ? iso : new Date(iso)).getTime();
  return new Date(ms + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** Add `n` days to a "YYYY-MM-DD" string (n may be negative). */
function addDays(day: string, n: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * UTC instant for the start of a "last N days" window (inclusive of today),
 * aligned to the start of the Bangkok day — safe to pass to a `createdAt >= since`
 * SQL filter.
 */
export function rangeToSince(now: Date, days: RangeDays): string {
  const startDay = addDays(bangkokDay(now), -(days - 1));
  return new Date(startDay + "T00:00:00+07:00").toISOString();
}

/**
 * Merge sparse per-day stamp/redemption buckets into a continuous series with
 * every Bangkok day from `since` to `now` present (gaps filled with 0), oldest
 * first.
 */
export function buildDailySeries(
  sinceISO: string,
  nowISO: string,
  stamps: DailyBucket[],
  redemptions: DailyBucket[],
): AnalyticsDailyPoint[] {
  const stampByDay = new Map(stamps.map((s) => [s.day, s.value]));
  const redeemByDay = new Map(redemptions.map((r) => [r.day, r.value]));

  const startDay = bangkokDay(sinceISO);
  const endDay = bangkokDay(nowISO);
  const out: AnalyticsDailyPoint[] = [];
  for (let day = startDay; day <= endDay; day = addDays(day, 1)) {
    out.push({
      day,
      stamps: stampByDay.get(day) ?? 0,
      redemptions: redeemByDay.get(day) ?? 0,
    });
  }
  return out;
}

/** % of active customers who also redeemed a reward (0–100, /0-safe). */
export function redemptionRate(redeemers: number, activeCustomers: number): number {
  if (activeCustomers <= 0) return 0;
  return Math.round((redeemers / activeCustomers) * 100);
}
