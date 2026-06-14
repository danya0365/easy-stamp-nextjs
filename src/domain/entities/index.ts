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
  | "contact_request";
export type ContactRequestStatus = "open" | "resolved";

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

export interface StampTransaction {
  id: string;
  shopId: string;
  branchId: string | null;
  customerId: string;
  cardId: string;
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

/** A customer's card enriched with the shop's threshold + derived eligibility. */
export interface CustomerCardView {
  customer: Customer;
  card: StampCard;
  threshold: number;
  rewardText: string;
  /** currentStamps >= threshold */
  eligibleToRedeem: boolean;
  /** Stamps still needed for the next reward (0 when eligible). */
  remaining: number;
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

export interface ContactRequest {
  id: string;
  shopId: string;
  createdBy: string;
  subject: string;
  message: string;
  contactChannel: string;
  status: ContactRequestStatus;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}
