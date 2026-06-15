import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { id, updatedAt } from "./_shared";
import { stampCards } from "./stamp-cards";
import { stampTypes } from "./stamp-types";

/**
 * A customer's running balance for ONE stamp type. Hangs off the customer's
 * shop card (stamp_cards = identity anchor per shop+customer). eligibleToRedeem
 * is derived (currentStamps >= type.threshold), not stored.
 */
export const stampBalances = sqliteTable(
  "stamp_balances",
  {
    id: id(),
    cardId: text()
      .notNull()
      .references(() => stampCards.id, { onDelete: "cascade" }),
    stampTypeId: text()
      .notNull()
      .references(() => stampTypes.id, { onDelete: "cascade" }),
    currentStamps: integer().notNull().default(0),
    lifetimeStamps: integer().notNull().default(0),
    rewardsEarned: integer().notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [unique("stamp_balances_card_type_unique").on(t.cardId, t.stampTypeId)],
);
