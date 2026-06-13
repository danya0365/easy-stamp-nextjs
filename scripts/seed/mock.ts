/**
 * MOCK data — fake-but-realistic data for development & demos. DO NOT run in
 * production. Idempotent (keyed by shop slug).
 *
 * Covers every table and every UI state:
 *  - 4 shops across all billing states: active / overdue-in-grace (banner) /
 *    overdue-suspended / admin-suspended
 *  - branches (incl. an inactive one), owner + staff (incl. an inactive one)
 *  - customers with varied balances AND redemption history
 *  - stamp_transactions (earn + redeem_adjust) with back-dated timestamps
 *  - reward_redemptions history
 *  - payments in all 3 states (pending / approved / rejected)
 */
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import {
  isRemoteDb,
  schema,
  daysFromNow,
  MONTHLY_AMOUNT_SATANG,
  type SeedContext,
} from "./_db";

const THRESHOLD = 10;

type Billing = "active" | "grace" | "suspended" | "admin";

interface ShopSpec {
  name: string;
  slug: string;
  categorySlug: string;
  billing: Billing;
  rewardText: string;
}

const SHOPS: ShopSpec[] = [
  {
    name: "ร้านกาแฟ A",
    slug: "coffee-a",
    categorySlug: "coffee",
    billing: "active",
    rewardText: "เลือกเครื่องดื่มในร้านฟรี 1 แก้ว",
  },
  {
    name: "ร้านชานม C",
    slug: "tea-c",
    categorySlug: "beverage",
    billing: "grace", // overdue ~3 days → escalating banner, not blocked
    rewardText: "ชานมไข่มุกฟรี 1 แก้ว",
  },
  {
    name: "ร้านเบเกอรี่ B",
    slug: "bakery-b",
    categorySlug: "bakery",
    billing: "suspended", // overdue > 7 days → blocked
    rewardText: "เลือกขนมในร้านฟรี 1 ชิ้น",
  },
  {
    name: "ร้านสปา D",
    slug: "spa-d",
    categorySlug: "beauty",
    billing: "admin", // admin-suspended
    rewardText: "นวดฟรี 30 นาที",
  },
];

// (lifetime, rewards) → currentStamps = lifetime - rewards*THRESHOLD
const CUSTOMERS = [
  { phone: "0810000001", name: "คุณสมชาย", lifetime: 3, rewards: 0 },
  { phone: "0810000002", name: null, lifetime: 9, rewards: 0 },
  { phone: "0810000003", name: "คุณมาลี", lifetime: 10, rewards: 0 }, // eligible
  { phone: "0820000004", name: "คุณวีระ", lifetime: 24, rewards: 2 }, // current 4
  { phone: "0820000005", name: null, lifetime: 15, rewards: 1 }, // current 5
  { phone: "0830000006", name: "คุณนภา", lifetime: 30, rewards: 3 }, // current 0
];

function billingFields(b: Billing) {
  switch (b) {
    case "active":
      return { dueOffset: 20, subStatus: "active" as const, shopStatus: "active" as const };
    case "grace":
      return { dueOffset: -3, subStatus: "past_due" as const, shopStatus: "active" as const };
    case "suspended":
      return { dueOffset: -12, subStatus: "past_due" as const, shopStatus: "active" as const };
    case "admin":
      return { dueOffset: 15, subStatus: "active" as const, shopStatus: "suspended_by_admin" as const };
  }
}

/** Split a total into 1–2 positive earn chunks for transaction history. */
function earnChunks(total: number): number[] {
  if (total <= 0) return [];
  if (total <= 5) return [total];
  const first = Math.floor(total / 2);
  return [first, total - first];
}

export async function seedMock(ctx: SeedContext) {
  const { db, passwordHash, log } = ctx;

  // Hard stop: mock data must never touch a real production DB.
  if (isRemoteDb()) {
    log("mock: remote DB detected — skipping dev-only mock data");
    return;
  }

  const admin = await db.query.users.findFirst({
    where: eq(schema.users.email, "admin@easystamp.test"),
  });
  const adminId = admin?.id ?? null;

  async function categoryIdBySlug(slug: string): Promise<string | null> {
    const c = await db.query.shopCategories.findFirst({
      where: eq(schema.shopCategories.slug, slug),
    });
    return c?.id ?? null;
  }

  for (let si = 0; si < SHOPS.length; si++) {
    const opts = SHOPS[si];
    const exists = await db.query.shops.findFirst({
      where: eq(schema.shops.slug, opts.slug),
    });
    if (exists) {
      log(`mock: shop "${opts.slug}" already exists — skip`);
      continue;
    }

    const bf = billingFields(opts.billing);
    const shopId = nanoid();
    await db.insert(schema.shops).values({
      id: shopId,
      name: opts.name,
      slug: opts.slug,
      status: bf.shopStatus,
      categoryId: await categoryIdBySlug(opts.categorySlug),
      stampThreshold: THRESHOLD,
      rewardText: opts.rewardText,
    });

    const subId = nanoid();
    await db.insert(schema.subscriptions).values({
      id: subId,
      shopId,
      status: bf.subStatus,
      amountSatang: MONTHLY_AMOUNT_SATANG,
      currentPeriodStartAt: daysFromNow(bf.dueOffset - 30),
      currentPeriodDueAt: daysFromNow(bf.dueOffset),
    });

    // Branches — second branch inactive on the admin-suspended shop, to demo state.
    const branchIds = [nanoid(), nanoid()];
    await db.insert(schema.branches).values([
      { id: branchIds[0], shopId, name: `${opts.name} - สาขาหลัก` },
      {
        id: branchIds[1],
        shopId,
        name: `${opts.name} - สาขา 2`,
        isActive: opts.billing !== "admin",
      },
    ]);

    // Owner + 2 staff (staff2 inactive on the suspended shop).
    const ownerId = nanoid();
    await db.insert(schema.users).values({
      id: ownerId,
      email: `owner@${opts.slug}.test`,
      passwordHash,
      role: "shop_owner",
      shopId,
      branchId: null,
    });
    const staffIds = [nanoid(), nanoid()];
    await db.insert(schema.users).values([
      {
        id: staffIds[0],
        email: `staff1@${opts.slug}.test`,
        passwordHash,
        role: "branch_staff",
        shopId,
        branchId: branchIds[0],
      },
      {
        id: staffIds[1],
        email: `staff2@${opts.slug}.test`,
        passwordHash,
        role: "branch_staff",
        shopId,
        branchId: branchIds[1],
        isActive: opts.billing !== "suspended",
      },
    ]);
    const actors = [ownerId, staffIds[0], staffIds[1]];

    // Customers + cards + transaction/redemption history.
    let tcount = 0;
    for (let ci = 0; ci < CUSTOMERS.length; ci++) {
      const spec = CUSTOMERS[ci];
      const current = spec.lifetime - spec.rewards * THRESHOLD;
      const customerId = nanoid();
      await db.insert(schema.customers).values({
        id: customerId,
        shopId,
        phone: spec.phone,
        displayName: spec.name,
        createdAt: daysFromNow(-60 + ci),
      });
      const cardId = nanoid();
      await db.insert(schema.stampCards).values({
        id: cardId,
        shopId,
        customerId,
        currentStamps: current,
        lifetimeStamps: spec.lifetime,
        rewardsEarned: spec.rewards,
      });

      // Earn transactions (back-dated, alternating branch/actor).
      const chunks = earnChunks(spec.lifetime);
      for (let k = 0; k < chunks.length; k++) {
        await db.insert(schema.stampTransactions).values({
          id: nanoid(),
          shopId,
          branchId: branchIds[k % 2],
          customerId,
          cardId,
          type: "earn",
          quantity: chunks[k],
          performedBy: actors[(ci + k) % actors.length],
          note: "seed",
          createdAt: daysFromNow(-50 + tcount++),
        });
      }

      // Redemption history.
      for (let r = 0; r < spec.rewards; r++) {
        const when = daysFromNow(-20 + tcount++);
        await db.insert(schema.rewardRedemptions).values({
          id: nanoid(),
          shopId,
          branchId: branchIds[r % 2],
          customerId,
          cardId,
          rewardTextSnapshot: opts.rewardText,
          stampsSpent: THRESHOLD,
          performedBy: actors[r % actors.length],
          createdAt: when,
        });
        await db.insert(schema.stampTransactions).values({
          id: nanoid(),
          shopId,
          branchId: branchIds[r % 2],
          customerId,
          cardId,
          type: "redeem_adjust",
          quantity: -THRESHOLD,
          performedBy: actors[r % actors.length],
          note: "แลกรางวัล",
          createdAt: when,
        });
      }
    }

    // Payment history per billing state.
    if (opts.billing === "active") {
      // One approved payment last cycle.
      await db.insert(schema.payments).values({
        id: nanoid(),
        shopId,
        subscriptionId: subId,
        amountSatang: MONTHLY_AMOUNT_SATANG,
        slipUrl: "slips/seed-placeholder.png",
        status: "approved",
        submittedBy: ownerId,
        verifiedBy: adminId,
        verifiedAt: daysFromNow(-28),
        coversPeriodStartAt: daysFromNow(-30),
        coversPeriodDueAt: daysFromNow(0),
        createdAt: daysFromNow(-29),
      });
    } else if (opts.billing === "suspended") {
      // A rejected attempt + a fresh pending one in the admin queue.
      await db.insert(schema.payments).values({
        id: nanoid(),
        shopId,
        subscriptionId: subId,
        amountSatang: MONTHLY_AMOUNT_SATANG,
        slipUrl: "slips/seed-placeholder.png",
        status: "rejected",
        submittedBy: ownerId,
        verifiedBy: adminId,
        verifiedAt: daysFromNow(-2),
        rejectReason: "ยอดเงินในสลิปไม่ตรงกับที่แจ้ง",
        createdAt: daysFromNow(-3),
      });
      await db.insert(schema.payments).values({
        id: nanoid(),
        shopId,
        subscriptionId: subId,
        amountSatang: MONTHLY_AMOUNT_SATANG,
        slipUrl: "slips/seed-placeholder.png",
        status: "pending",
        submittedBy: ownerId,
        coversPeriodStartAt: daysFromNow(0),
        coversPeriodDueAt: daysFromNow(30),
        createdAt: daysFromNow(0),
      });
    } else if (opts.billing === "grace") {
      // A pending payment awaiting review.
      await db.insert(schema.payments).values({
        id: nanoid(),
        shopId,
        subscriptionId: subId,
        amountSatang: MONTHLY_AMOUNT_SATANG,
        slipUrl: "slips/seed-placeholder.png",
        status: "pending",
        submittedBy: ownerId,
        coversPeriodStartAt: daysFromNow(0),
        coversPeriodDueAt: daysFromNow(30),
        createdAt: daysFromNow(0),
      });
    }

    log(`mock: created "${opts.slug}" (${opts.billing}) + customers/history`);
  }
}
