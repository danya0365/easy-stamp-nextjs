import type { ShopStatus, SubscriptionStatus } from "../entities";

export type BillingState = "active" | "overdue" | "suspended";

export interface BillingStatus {
  state: BillingState;
  /** Whole days past the due date (0 if not yet due). */
  daysOverdue: number;
  /** True when access should be blocked (overdue > grace, or admin-suspended). */
  isSuspended: boolean;
  /** 0 = no banner; 1–7 = escalating dunning banner. */
  bannerLevel: number;
  /** Days remaining in the grace window before suspension (0 when suspended). */
  graceDaysLeft: number;
  /** Why the shop is suspended, when it is. */
  suspendReason: "none" | "overdue" | "admin";
}

/** Number of days a shop may remain overdue before the system blocks it. */
export const GRACE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface BillingInput {
  /** ISO-8601 due date of the current billing period. */
  currentPeriodDueAt: string;
  /** Stored subscription status (cache; the due date is authoritative). */
  status?: SubscriptionStatus;
  /** Manual platform suspension overrides everything. */
  shopStatus?: ShopStatus;
}

/**
 * Pure, deterministic billing-state computation. Suspension and dunning are
 * derived from the due date vs `now` — no cron, no stored flags required.
 */
export function computeBillingState(input: BillingInput, now: Date): BillingStatus {
  if (input.shopStatus === "suspended_by_admin") {
    return {
      state: "suspended",
      daysOverdue: 0,
      isSuspended: true,
      bannerLevel: 0,
      graceDaysLeft: 0,
      suspendReason: "admin",
    };
  }

  const due = new Date(input.currentPeriodDueAt).getTime();
  const diffMs = now.getTime() - due;
  const daysOverdue = diffMs <= 0 ? 0 : Math.floor(diffMs / DAY_MS);

  if (daysOverdue === 0) {
    return {
      state: "active",
      daysOverdue: 0,
      isSuspended: false,
      bannerLevel: 0,
      graceDaysLeft: GRACE_DAYS,
      suspendReason: "none",
    };
  }

  if (daysOverdue > GRACE_DAYS) {
    return {
      state: "suspended",
      daysOverdue,
      isSuspended: true,
      bannerLevel: GRACE_DAYS,
      graceDaysLeft: 0,
      suspendReason: "overdue",
    };
  }

  return {
    state: "overdue",
    daysOverdue,
    isSuspended: false,
    bannerLevel: daysOverdue,
    graceDaysLeft: GRACE_DAYS - daysOverdue,
    suspendReason: "none",
  };
}
