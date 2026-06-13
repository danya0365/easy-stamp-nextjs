import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";

/**
 * Reference data: types of shops (cafe, bakery, ...). Seeded as starter data;
 * shops optionally reference one. Managed by the platform admin.
 */
export const shopCategories = sqliteTable("shop_categories", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  sortOrder: integer().notNull().default(0),
  isActive: integer({ mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});
