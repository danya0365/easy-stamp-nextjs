/**
 * Pure, deterministic pricing for the prepaid "day top-up" model.
 *
 * Two ways to top up:
 *  - a preset package (fixed price + bonus days), or
 *  - a custom number of days at the shop's per-day rate, with a tiered bonus.
 *
 * The amount is ALWAYS computed here from a package id or a day count — the
 * client never supplies a price. Mirrors the pure style of subscription-status.ts.
 */

export interface TopupPackage {
  /** Stable id, stored on the payment so historical orders stay accurate. */
  id: string;
  label: string;
  /** Base paid days. */
  days: number;
  /** Free days granted on top of `days`. */
  bonusDays: number;
  /** Fixed package price in satang (THB cents). */
  priceSatang: number;
  /** Marketing badge shown on the card. */
  badge?: "popular" | "best_value";
}

/** Default per-day rate: ฿10/วัน → ~฿300/เดือน (≈ the previous ฿299 monthly). */
export const DEFAULT_PRICE_PER_DAY_SATANG = 1000;

export const MIN_CUSTOM_DAYS = 1;
/** Cap a single top-up at 3 years. */
export const MAX_CUSTOM_DAYS = 1095;

/** Window (days before expiry) within which we nudge the owner to top up. */
export const PRE_EXPIRY_WARN_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Preset packages. Prices are set so that longer packages "feel" the same per
 * day, but earn progressively more bonus days — the long packages are the
 * anchors we want owners to choose.
 */
export const TOPUP_PRESETS: readonly TopupPackage[] = [
  { id: "d30", label: "30 วัน", days: 30, bonusDays: 0, priceSatang: 30000 },
  { id: "d90", label: "90 วัน", days: 90, bonusDays: 7, priceSatang: 90000 },
  {
    id: "d180",
    label: "180 วัน",
    days: 180,
    bonusDays: 20,
    priceSatang: 180000,
    badge: "popular",
  },
  {
    id: "d365",
    label: "365 วัน",
    days: 365,
    bonusDays: 45,
    priceSatang: 365000,
    badge: "best_value",
  },
];

export function findPreset(id: string): TopupPackage | null {
  return TOPUP_PRESETS.find((p) => p.id === id) ?? null;
}

/**
 * Tiered bonus for CUSTOM day counts. Thresholds align with the presets so a
 * custom 150-day order matches the spirit of the "5 months + 1 month free" deal.
 */
export function computeCustomBonusDays(days: number): number {
  if (days >= 365) return 45;
  if (days >= 150) return 30;
  if (days >= 90) return 7;
  return 0;
}

export interface TopupQuote {
  /** Preset id, or null for a custom-day order. */
  packageId: string | null;
  /** Base days purchased. */
  baseDays: number;
  /** Free bonus days granted. */
  bonusDays: number;
  /** baseDays + bonusDays — the actual days added to the shop. */
  totalDays: number;
  /** Server-trusted charge in satang. */
  amountSatang: number;
}

/**
 * Resolve any order (preset id OR custom days) into a normalized, server-trusted
 * quote. Throws on an unknown package id or an out-of-range day count.
 */
export function resolveTopupQuote(
  input: { packageId?: string | null; customDays?: number | null },
  pricePerDaySatang: number,
): TopupQuote {
  const rate =
    Number.isFinite(pricePerDaySatang) && pricePerDaySatang > 0
      ? Math.round(pricePerDaySatang)
      : DEFAULT_PRICE_PER_DAY_SATANG;

  if (input.packageId) {
    const preset = findPreset(input.packageId);
    if (!preset) throw new Error("ไม่พบแพ็กเกจที่เลือก");
    return {
      packageId: preset.id,
      baseDays: preset.days,
      bonusDays: preset.bonusDays,
      totalDays: preset.days + preset.bonusDays,
      amountSatang: preset.priceSatang,
    };
  }

  const days = Math.floor(Number(input.customDays));
  if (!Number.isFinite(days) || days < MIN_CUSTOM_DAYS) {
    throw new Error(`จำนวนวันต้องอย่างน้อย ${MIN_CUSTOM_DAYS} วัน`);
  }
  if (days > MAX_CUSTOM_DAYS) {
    throw new Error(`จำนวนวันสูงสุดต่อครั้งคือ ${MAX_CUSTOM_DAYS} วัน`);
  }
  const bonusDays = computeCustomBonusDays(days);
  return {
    packageId: null,
    baseDays: days,
    bonusDays,
    totalDays: days + bonusDays,
    amountSatang: days * rate,
  };
}

/**
 * Savings vs. paying for `totalDays` at the plain per-day rate, as a whole
 * percent (the value of the free bonus days + any package discount). 0 if none.
 */
export function computeSavingsPercent(
  quote: TopupQuote,
  pricePerDaySatang: number,
): number {
  const rate =
    pricePerDaySatang > 0 ? pricePerDaySatang : DEFAULT_PRICE_PER_DAY_SATANG;
  const fullValue = quote.totalDays * rate;
  if (fullValue <= 0) return 0;
  const saved = fullValue - quote.amountSatang;
  if (saved <= 0) return 0;
  return Math.round((saved / fullValue) * 100);
}

/**
 * New expiry after adding `totalDays`. Stacking rule: extend from the LATER of
 * now / current expiry — topping up early never wastes remaining days; topping
 * up after the shop has lapsed simply starts the new days from now.
 */
export function computeNewExpiry(
  currentExpiryISO: string,
  totalDays: number,
  now: Date,
): string {
  const current = new Date(currentExpiryISO).getTime();
  const from = Math.max(
    now.getTime(),
    Number.isFinite(current) ? current : now.getTime(),
  );
  return new Date(from + totalDays * DAY_MS).toISOString();
}
