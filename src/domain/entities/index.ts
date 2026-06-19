import type { Role } from "../types/roles";

export type ShopStatus = "active" | "suspended_by_admin";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type StampTxType = "earn" | "redeem_adjust";
export type TopupTxType = "topup" | "adjustment";
export type NotificationType =
  | "payment_submitted"
  | "payment_approved"
  | "payment_rejected"
  | "contact_request"
  | "contact_resolved"
  | "lead_follow_up_due";
export type ContactRequestStatus = "open" | "resolved";

export type LeadStatus = "new" | "visited" | "interested" | "won" | "lost";
export type LeadLostReason =
  | "not_interested"
  | "too_expensive"
  | "no_smartphone"
  | "closed_business"
  | "competitor"
  | "other";
export type LeadVisitReaction = "positive" | "neutral" | "negative" | "no_answer";

export interface ShopCategory {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  status: ShopStatus;
  categoryId: string | null;
  stampThreshold: number;
  rewardText: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  shopId: string;
  name: string;
  isActive: boolean;
  /** Physical location, null until the owner sets it from /shop/branches. */
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  shopId: string | null;
  branchId: string | null;
  isActive: boolean;
  /** LINE Messaging API push target, null until the operator links their LINE. */
  lineUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** User row including the password hash — never leaves the infrastructure layer. */
export interface UserWithSecret extends User {
  passwordHash: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  shopId: string;
  phone: string;
  displayName: string | null;
  /** Opaque code embedded in the customer's QR. */
  publicCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface StampCard {
  id: string;
  shopId: string;
  customerId: string;
  currentStamps: number;
  lifetimeStamps: number;
  rewardsEarned: number;
  updatedAt: string;
}

export interface StampType {
  id: string;
  shopId: string;
  name: string;
  threshold: number;
  rewardText: string;
  /** Optional baht price (label/metadata), in satang; null = not priced. */
  priceSatang: number | null;
  isActive: boolean;
  /** Exactly one per shop — the migrated legacy single-stamp track. */
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StampBalance {
  id: string;
  cardId: string;
  stampTypeId: string;
  currentStamps: number;
  lifetimeStamps: number;
  rewardsEarned: number;
  updatedAt: string;
}

export interface StampTransaction {
  id: string;
  shopId: string;
  branchId: string | null;
  customerId: string;
  cardId: string;
  stampTypeId: string | null;
  type: StampTxType;
  quantity: number;
  performedBy: string;
  note: string | null;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  shopId: string;
  branchId: string | null;
  customerId: string;
  cardId: string;
  stampTypeId: string | null;
  rewardTextSnapshot: string;
  stampsSpent: number;
  performedBy: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  shopId: string;
  status: SubscriptionStatus;
  /** Per-day rate for custom top-ups, in satang. */
  pricePerDaySatang: number;
  /** Vestigial old monthly price; unused going forward. */
  amountSatang: number;
  currentPeriodStartAt: string;
  /** Expiry / paid-through date. */
  currentPeriodDueAt: string;
  /** Set when the shop is temporarily paused (billing clock frozen); else null. */
  pausedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  shopId: string;
  subscriptionId: string;
  amountSatang: number;
  /** Base days this top-up buys. */
  daysToAdd: number;
  /** Free bonus days granted on approval. */
  bonusDays: number;
  /** Preset package id, or null for a custom-day order. */
  packageId: string | null;
  slipUrl: string;
  status: PaymentStatus;
  submittedBy: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  coversPeriodStartAt: string | null;
  coversPeriodDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopupTransaction {
  id: string;
  shopId: string;
  paymentId: string | null;
  type: TopupTxType;
  daysAdded: number;
  bonusDaysAdded: number;
  amountSatang: number;
  expiryBeforeAt: string | null;
  expiryAfterAt: string;
  performedBy: string;
  note: string | null;
  createdAt: string;
}

/** A customer's progress on ONE stamp type (derived; not stored). */
export interface StampTypeProgress {
  type: StampType;
  currentStamps: number;
  lifetimeStamps: number;
  rewardsEarned: number;
  /** currentStamps >= type.threshold */
  eligibleToRedeem: boolean;
  /** Stamps still needed for the next reward of this type (0 when eligible). */
  remaining: number;
}

/** A customer's card = their progress across all active stamp types of a shop. */
export interface CustomerCardView {
  customer: Customer;
  types: StampTypeProgress[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export type ContactRequestSource = "operator" | "public";

export interface ContactRequest {
  id: string;
  /** Null for public (login-page) requests. */
  shopId: string | null;
  createdBy: string | null;
  /** Email the reporter typed (public requests) — helps admin find the account. */
  email: string | null;
  source: ContactRequestSource;
  ipAddress: string | null;
  subject: string;
  message: string;
  contactChannel: string;
  status: ContactRequestStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// --- Leads (field-sales CRM; separate from billable shops) ---

export interface Lead {
  id: string;
  name: string;
  categoryId: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Storage key of the shop photo; served via /api/lead-photos/[leadId]. */
  photoUrl: string | null;
  status: LeadStatus;
  /** Only set when status = "lost". */
  lostReason: LeadLostReason | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  /** Set on conversion: the real shop created from this lead. */
  convertedShopId: string | null;
  convertedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadVisitLog {
  id: string;
  leadId: string;
  reaction: LeadVisitReaction;
  statusBefore: LeadStatus | null;
  statusAfter: LeadStatus | null;
  note: string | null;
  performedBy: string;
  createdAt: string;
}

/** Admin map read-model: a lead with coordinates (not yet converted). */
export interface LeadMapLocation {
  leadId: string;
  name: string;
  status: LeadStatus;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
}

// --- Analytics (read models; derived, not stored) ---

export interface AnalyticsSummary {
  /** Total stamps given out in the range (sum of earn quantity). */
  stampsIssued: number;
  /** Rewards redeemed in the range. */
  redemptions: number;
  /** Distinct customers who earned a stamp in the range. */
  activeCustomers: number;
  /** Distinct customers who redeemed a reward in the range. */
  redeemers: number;
  /** Customers first seen in the range. */
  newCustomers: number;
  /** All-time customer count for the shop. */
  totalCustomers: number;
}

/** One Bangkok-day bucket of activity. `day` is "YYYY-MM-DD". */
export interface AnalyticsDailyPoint {
  day: string;
  stamps: number;
  redemptions: number;
}

export interface AnalyticsTypeRow {
  stampTypeId: string | null;
  name: string;
  stamps: number;
  redemptions: number;
}

export interface AnalyticsBranchRow {
  branchId: string | null;
  name: string;
  stamps: number;
  redemptions: number;
}

export interface AnalyticsTopCustomer {
  customerId: string;
  label: string;
  stamps: number;
}

export interface ShopAnalyticsView {
  rangeDays: number;
  summary: AnalyticsSummary;
  /** % of active customers who also redeemed (0–100). */
  redemptionRate: number;
  daily: AnalyticsDailyPoint[];
  byType: AnalyticsTypeRow[];
  byBranch: AnalyticsBranchRow[];
  topCustomers: AnalyticsTopCustomer[];
}

/** A sparse {day,value} bucket as returned by the analytics repo. */
export interface DailyBucket {
  day: string;
  value: number;
}

/**
 * An account previously used to sign in on this device (FB-style account
 * switcher). Stored device-side; never includes credentials or a session.
 */
export interface KnownAccount {
  email: string;
  role: Role;
}

// --- Platform analytics (cross-shop read models) ---

export interface PlatformAnalyticsSummary {
  /** Total stamps given out across all shops in the range. */
  stampsIssued: number;
  /** Rewards redeemed across all shops in the range. */
  redemptions: number;
  /** Distinct customers (any shop) who earned a stamp in the range. */
  activeCustomers: number;
  /** Distinct customers (any shop) who redeemed a reward in the range. */
  redeemers: number;
  /** Customers first seen in the range (any shop). */
  newCustomers: number;
  /** All-time customer count across all shops. */
  totalCustomers: number;
  /** All-time shop count. */
  totalShops: number;
  /** Distinct shops that issued at least one stamp in the range. */
  activeShops: number;
}

/** One shop's activity in the range (platform leaderboard row). */
export interface AnalyticsShopRow {
  shopId: string;
  name: string;
  stamps: number;
  redemptions: number;
}

export interface PlatformAnalyticsView {
  rangeDays: number;
  summary: PlatformAnalyticsSummary;
  /** % of active customers who also redeemed (0–100). */
  redemptionRate: number;
  daily: AnalyticsDailyPoint[];
  byShop: AnalyticsShopRow[];
}
