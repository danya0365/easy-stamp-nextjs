import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { id, updatedAt } from "./_shared";
import { shops } from "./shops";
import { customers } from "./customers";

/**
 * One card per customer per shop. `eligibleToRedeem` is NOT stored — it is
 * derived (currentStamps >= shop.stampThreshold) in the domain/use-case layer.
 */
export const stampCards = sqliteTable(
  "stamp_cards",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    customerId: text()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    // Running balance toward the current reward.
    currentStamps: integer().notNull().default(0),
    // Total stamps ever earned (stats).
    lifetimeStamps: integer().notNull().default(0),
    // Total rewards redeemed (stats).
    rewardsEarned: integer().notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [unique("stamp_cards_shop_customer_unique").on(t.shopId, t.customerId)],
);
