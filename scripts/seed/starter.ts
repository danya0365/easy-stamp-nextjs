/**
 * STARTER data — reference data + what the admin must set before launch.
 *  - shop categories (reference data, used now & in the future)
 *  - ONE clean example shop the merchant can actually use to test for real
 * Safe for production. Idempotent (keyed by slug).
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import {
  schema,
  daysFromNow,
  MONTHLY_AMOUNT_SATANG,
  type SeedContext,
} from "./_db";

const CATEGORIES = [
  { slug: "coffee", name: "ร้านกาแฟ" },
  { slug: "bakery", name: "เบเกอรี่ & ขนม" },
  { slug: "food", name: "ร้านอาหาร" },
  { slug: "beverage", name: "เครื่องดื่ม" },
  { slug: "beauty", name: "ความงาม & สปา" },
  { slug: "retail", name: "ค้าปลีก" },
  { slug: "other", name: "อื่นๆ" },
];

const EXAMPLE_SHOP_SLUG = "demo";
const EXAMPLE_OWNER_EMAIL = "owner@demo.easystamp.test";

export async function seedStarter({ db, passwordHash, log }: SeedContext) {
  // --- Categories (reference data) ---
  const categoryId = new Map<string, string>();
  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const existing = await db.query.shopCategories.findFirst({
      where: eq(schema.shopCategories.slug, cat.slug),
    });
    if (existing) {
      categoryId.set(cat.slug, existing.id);
      continue;
    }
    const id = nanoid();
    await db.insert(schema.shopCategories).values({
      id,
      name: cat.name,
      slug: cat.slug,
      sortOrder: i,
    });
    categoryId.set(cat.slug, id);
  }
  log(`starter: ${CATEGORIES.length} categories ensured`);

  // --- One clean example shop for real testing ---
  const existingShop = await db.query.shops.findFirst({
    where: eq(schema.shops.slug, EXAMPLE_SHOP_SLUG),
  });
  if (existingShop) {
    log(`starter: example shop "${EXAMPLE_SHOP_SLUG}" already exists — skip`);
    return;
  }

  const shopId = nanoid();
  await db.insert(schema.shops).values({
    id: shopId,
    name: "ร้านตัวอย่าง (Demo)",
    slug: EXAMPLE_SHOP_SLUG,
    status: "active",
    categoryId: categoryId.get("coffee") ?? null,
    stampThreshold: 10,
    rewardText: "เลือกเครื่องดื่มในร้านฟรี 1 แก้ว",
  });

  await db.insert(schema.subscriptions).values({
    id: nanoid(),
    shopId,
    status: "active",
    amountSatang: MONTHLY_AMOUNT_SATANG,
    currentPeriodStartAt: daysFromNow(0),
    currentPeriodDueAt: daysFromNow(30),
  });

  await db.insert(schema.branches).values({
    id: nanoid(),
    shopId,
    name: "สาขาหลัก",
  });

  await db.insert(schema.users).values({
    id: nanoid(),
    email: EXAMPLE_OWNER_EMAIL,
    passwordHash,
    role: "shop_owner",
    shopId,
    branchId: null,
  });

  log(
    `starter: created example shop "${EXAMPLE_SHOP_SLUG}" (owner ${EXAMPLE_OWNER_EMAIL})`,
  );
}
