import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";
import { subscriptions } from "./subscriptions";
import { users } from "./users";

export const PAYMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** A monthly payment submission (PromptPay slip) awaiting admin verification. */
export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    subscriptionId: text()
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    amountSatang: integer().notNull(),
    // Path/URL to the uploaded slip image.
    slipUrl: text().notNull(),
    status: text({ enum: PAYMENT_STATUSES }).notNull().default("pending"),
    submittedBy: text()
      .notNull()
      .references(() => users.id),
    verifiedBy: text().references(() => users.id),
    verifiedAt: text(),
    rejectReason: text(),
    // The new period this payment sets on the subscription if approved.
    coversPeriodStartAt: text(),
    coversPeriodDueAt: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("payments_shop_created_idx").on(t.shopId, t.createdAt),
    index("payments_status_idx").on(t.status),
  ],
);
