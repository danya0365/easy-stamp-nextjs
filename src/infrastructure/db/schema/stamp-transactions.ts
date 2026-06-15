import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { branches } from "./branches";
import { customers } from "./customers";
import { stampCards } from "./stamp-cards";
import { stampTypes } from "./stamp-types";
import { users } from "./users";

export const STAMP_TX_TYPES = ["earn", "redeem_adjust"] as const;
export type StampTxType = (typeof STAMP_TX_TYPES)[number];

/** Immutable ledger of every stamp movement (audit trail). */
export const stampTransactions = sqliteTable(
  "stamp_transactions",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    branchId: text().references(() => branches.id, { onDelete: "set null" }),
    customerId: text()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    cardId: text()
      .notNull()
      .references(() => stampCards.id, { onDelete: "cascade" }),
    // Which stamp type this movement belongs to. Nullable for migration safety
    // (backfilled to each shop's default type); the app always sets it.
    stampTypeId: text().references(() => stampTypes.id, { onDelete: "set null" }),
    type: text({ enum: STAMP_TX_TYPES }).notNull(),
    // +N for earn, negative (−threshold) for the decrement on redemption.
    quantity: integer().notNull(),
    // Users are never hard-deleted (deactivated via is_active), so keep this
    // non-null with no cascade to preserve the audit trail.
    performedBy: text()
      .notNull()
      .references(() => users.id),
    note: text(),
    createdAt: createdAt(),
  },
  (t) => [
    index("stamp_tx_shop_customer_idx").on(t.shopId, t.customerId),
    index("stamp_tx_card_idx").on(t.cardId),
    index("stamp_tx_shop_created_idx").on(t.shopId, t.createdAt),
    // Cross-shop (platform analytics) range scans filter on createdAt only.
    index("stamp_tx_created_idx").on(t.createdAt),
  ],
);
