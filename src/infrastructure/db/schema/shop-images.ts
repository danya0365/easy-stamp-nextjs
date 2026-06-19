import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { id, createdAt } from "./_shared";
import { shops } from "./shops";

/** A shop's profile image (max one) or a gallery photo (many). */
export const SHOP_IMAGE_KINDS = ["profile", "gallery"] as const;
export type ShopImageKind = (typeof SHOP_IMAGE_KINDS)[number];

/** Owner-uploaded shop imagery shown on the public shop page. */
export const shopImages = sqliteTable(
  "shop_images",
  {
    id: id(),
    shopId: text()
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    kind: text({ enum: SHOP_IMAGE_KINDS }).notNull(),
    // Storage key (served publicly via /api/shop-images/[imageId]).
    storageKey: text().notNull(),
    sortOrder: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("shop_images_shop_idx").on(t.shopId)],
);
