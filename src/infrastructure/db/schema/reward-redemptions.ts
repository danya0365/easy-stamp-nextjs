import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";
import { branches } from "./branches";
import { customers } from "./customers";
import { stampCards } from "./stamp-cards";
import { stampTypes } from "./stamp-types";
import { users } from "./users";

/** History of every reward redemption. */
export const rewardRedemptions = sqliteTable(
  "reward_redemptions",
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
    // Which stamp type was redeemed. Nullable for migration safety (backfilled
    // to each shop's default type); the app always sets it.
    stampTypeId: text().references(() => stampTypes.id, { onDelete: "set null" }),
    // Snapshot of the type's rewardText at redemption time (reward can change).
    rewardTextSnapshot: text().notNull(),
    // Stamps consumed — equals the shop threshold at redemption time.
    stampsSpent: integer().notNull(),
    performedBy: text()
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index("redemptions_shop_customer_idx").on(t.shopId, t.customerId),
    index("redemptions_shop_created_idx").on(t.shopId, t.createdAt),
  ],
);
