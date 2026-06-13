import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt, updatedAt } from "./_shared";
import { shopCategories } from "./shop-categories";

export const SHOP_STATUSES = ["active", "suspended_by_admin"] as const;
export type ShopStatus = (typeof SHOP_STATUSES)[number];

export const shops = sqliteTable(
  "shops",
  {
    id: id(),
    name: text().notNull(),
    // Used in the public URL: /s/[slug]
    slug: text().notNull().unique(),
    // Manual platform-level suspension; billing-derived suspension is computed, not stored.
    status: text({ enum: SHOP_STATUSES }).notNull().default("active"),
    // Optional reference to a shop category (reference/starter data).
    categoryId: text().references(() => shopCategories.id, {
      onDelete: "set null",
    }),
    // Stamps required for one reward.
    stampThreshold: integer().notNull().default(10),
    // Free-text reward description, e.g. "เลือกของในร้านฟรี 1 อย่าง".
    rewardText: text().notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("shops_category_idx").on(t.categoryId)],
);
