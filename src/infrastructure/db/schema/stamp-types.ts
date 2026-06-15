import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shops } from "./shops";

/**
 * A reward track a shop offers. A shop has 1+ types (e.g. price tiers
 * "แสตมป์ 20฿"). Each type has its own threshold + reward and is tracked
 * separately per customer (see stamp_balances). Every shop has exactly one
 * isDefault type (the migration of the old single-stamp model).
 */
export const stampTypes = sqliteTable(
  "stamp_types",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text().notNull(),
    // Stamps required to redeem one reward of this type.
    threshold: integer().notNull().default(10),
    rewardText: text().notNull().default(""),
    // Optional baht price this stamp maps to (label/metadata only), in satang.
    priceSatang: integer(),
    isActive: integer({ mode: "boolean" }).notNull().default(true),
    // Exactly one per shop — carries the legacy shop.stampThreshold/rewardText.
    isDefault: integer({ mode: "boolean" }).notNull().default(false),
    sortOrder: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("stamp_types_shop_idx").on(t.shopId)],
);
