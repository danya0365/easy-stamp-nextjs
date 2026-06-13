import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "suspended",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * One subscription per shop. The stored `status` is a convenience cache;
 * the source of truth for enforcement is `currentPeriodDueAt` vs now,
 * computed by domain/services/subscription-status.ts.
 */
export const subscriptions = sqliteTable("subscriptions", {
  id: id(),
  shopId: text()
    .notNull()
    .unique()
    .references(() => shops.id, { onDelete: "cascade" }),
  status: text({ enum: SUBSCRIPTION_STATUSES }).notNull().default("trialing"),
  // Fixed monthly price, stored in satang (THB cents).
  amountSatang: integer().notNull(),
  currentPeriodStartAt: text().notNull(),
  // The due date that dunning/suspension is computed from.
  currentPeriodDueAt: text().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
