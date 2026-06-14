/**
 * MOCK data — fake-but-realistic data for development & demos. DEV ONLY
 * (the orchestrator refuses to run this against a remote DB). Idempotent
 * (keyed by shop slug).
 *
 * Covers every table and every UI state:
 *  - 4 shops across all billing states: active / overdue-in-grace (banner) /
 *    overdue-suspended / admin-suspended
 *  - branches (incl. an inactive one), owner + staff (incl. an inactive one)
 *  - customers with varied balances AND redemption history
 *  - stamp_transactions (earn + redeem_adjust), reward_redemptions
 *  - payments in all 3 states + topup_transactions ledger for approved ones
 */
import { eq } from "drizzle-orm";

import { schema, daysFromNow, type SeedContext } from "./_db";
import { getOrCreate, insert, quotePayment, approveTopup } from "./_helpers";
import { DEFAULT_PRICE_PER_DAY_SATANG } from "../../src/domain/services/topup-pricing";

const THRESHOLD = 10;
const DAY = 864e5;
const RATE = DEFAULT_PRICE_PER_DAY_SATANG;
const SLIP = "slips/seed-placeholder.png";

type Billing = "active" | "grace" | "suspended" | "admin";

interface ShopSpec {
  name: string;
  slug: string;
  categorySlug: string;
  billing: Billing;
  rewardText: string;
  /** Main-branch location (Bangkok) so the public map has pins to show. */
  lat: number;
  lng: number;
  address: string;
}

const SHOPS: ShopSpec[] = [
  {
    name: "ร้านกาแฟ A",
    slug: "coffee-a",
    categorySlug: "coffee",
    billing: "active",
    rewardText: "เลือกเครื่องดื่มในร้านฟรี 1 แก้ว",
    lat: 13.7466,
    lng: 100.5347,
    address: "สยามสแควร์ ปทุมวัน กรุงเทพฯ",
  },
  {
    name: "ร้านชานม C",
    slug: "tea-c",
    categorySlug: "beverage",
    billing: "grace", // overdue ~3 days → escalating banner, not blocked
    rewardText: "ชานมไข่มุกฟรี 1 แก้ว",
    lat: 13.7373,
    lng: 100.5601,
    address: "อโศก สุขุมวิท กรุงเทพฯ",
  },
  {
    name: "ร้านเบเกอรี่ B",
    slug: "bakery-b",
    categorySlug: "bakery",
    billing: "suspended", // overdue > 7 days → blocked
    rewardText: "เลือกขนมในร้านฟรี 1 ชิ้น",
    lat: 13.7649,
    lng: 100.5383,
    address: "อารีย์ พหลโยธิน กรุงเทพฯ",
  },
  {
    name: "ร้านสปา D",
    slug: "spa-d",
    categorySlug: "beauty",
    billing: "admin", // admin-suspended
    rewardText: "นวดฟรี 30 นาที",
    lat: 13.7305,
    lng: 100.5697,
    address: "ทองหล่อ สุขุมวิท กรุงเทพฯ",
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

  const admin = await db.query.users.findFirst({
    where: eq(schema.users.email, "admin@easystamp.test"),
  });
  if (!admin) {
    throw new Error(
      "mock: ต้องมี platform admin ก่อน — รัน `production` ก่อน (หรือรันแบบไม่ระบุ profile เพื่อ seed ทั้งคู่)",
    );
  }
  const adminId = admin.id;

  for (const opts of SHOPS) {
    const bf = billingFields(opts.billing);
    const category = await db.query.shopCategories.findFirst({
      where: eq(schema.shopCategories.slug, opts.categorySlug),
    });

    const shop = await getOrCreate(
      db,
      schema.shops,
      db.query.shops.findFirst({ where: eq(schema.shops.slug, opts.slug) }),
      {
        name: opts.name,
        slug: opts.slug,
        status: bf.shopStatus,
        categoryId: category?.id ?? null,
        stampThreshold: THRESHOLD,
        rewardText: opts.rewardText,
      },
    );
    if (!shop.created) {
      log(`mock: shop "${opts.slug}" exists — skip`);
      continue;
    }
    const shopId = shop.id;

    const subId = await insert(db, schema.subscriptions, {
      shopId,
      status: bf.subStatus,
      pricePerDaySatang: RATE,
      currentPeriodStartAt: daysFromNow(bf.dueOffset - 30),
      currentPeriodDueAt: daysFromNow(bf.dueOffset),
    });

    // Branches — second branch inactive on the admin-suspended shop, to demo state.
    const mainBranchId = await insert(db, schema.branches, {
      shopId,
      name: `${opts.name} - สาขาหลัก`,
      latitude: opts.lat,
      longitude: opts.lng,
      address: opts.address,
    });
    const branch2Id = await insert(db, schema.branches, {
      shopId,
      name: `${opts.name} - สาขา 2`,
      isActive: opts.billing !== "admin",
      // Offset a touch so the second branch doesn't overlap the main pin.
      latitude: opts.lat + 0.01,
      longitude: opts.lng + 0.01,
      address: opts.address,
    });
    const branchIds = [mainBranchId, branch2Id];

    // Owner + 2 staff (staff2 inactive on the suspended shop).
    const ownerId = await insert(db, schema.users, {
      email: `owner@${opts.slug}.test`,
      passwordHash,
      role: "shop_owner",
      shopId,
      branchId: null,
    });
    const staff1Id = await insert(db, schema.users, {
      email: `staff1@${opts.slug}.test`,
      passwordHash,
      role: "branch_staff",
      shopId,
      branchId: branchIds[0],
    });
    const staff2Id = await insert(db, schema.users, {
      email: `staff2@${opts.slug}.test`,
      passwordHash,
      role: "branch_staff",
      shopId,
      branchId: branchIds[1],
      isActive: opts.billing !== "suspended",
    });
    const actors = [ownerId, staff1Id, staff2Id];

    // Customers + cards + transaction/redemption history.
    let tcount = 0;
    for (let ci = 0; ci < CUSTOMERS.length; ci++) {
      const spec = CUSTOMERS[ci];
      const current = spec.lifetime - spec.rewards * THRESHOLD;
      const customerId = await insert(db, schema.customers, {
        shopId,
        phone: spec.phone,
        displayName: spec.name,
        createdAt: daysFromNow(-60 + ci),
      });
      const cardId = await insert(db, schema.stampCards, {
        shopId,
        customerId,
        currentStamps: current,
        lifetimeStamps: spec.lifetime,
        rewardsEarned: spec.rewards,
      });

      // Earn transactions (back-dated, alternating branch/actor).
      const chunks = earnChunks(spec.lifetime);
      for (let k = 0; k < chunks.length; k++) {
        await insert(db, schema.stampTransactions, {
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
        await insert(db, schema.rewardRedemptions, {
          shopId,
          branchId: branchIds[r % 2],
          customerId,
          cardId,
          rewardTextSnapshot: opts.rewardText,
          stampsSpent: THRESHOLD,
          performedBy: actors[r % actors.length],
          createdAt: when,
        });
        await insert(db, schema.stampTransactions, {
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

    await seedPayments({ ctx, opts, shopId, subId, ownerId, adminId });

    log(`mock: created "${opts.slug}" (${opts.billing}) + customers/history`);
  }
}

/** Payment + ledger history per billing state, via the real top-up write path. */
async function seedPayments(args: {
  ctx: SeedContext;
  opts: ShopSpec;
  shopId: string;
  subId: string;
  ownerId: string;
  adminId: string;
}) {
  const { db } = args.ctx;
  const { opts, shopId, subId, ownerId, adminId } = args;

  /** Insert a payment row from a quote; returns its id. */
  async function addPayment(
    packageId: string,
    status: "pending" | "approved" | "rejected",
    submittedDaysAgo: number,
    extra: Record<string, unknown> = {},
  ) {
    const submitNow = new Date(Date.now() - submittedDaysAgo * DAY);
    const expiryAtSubmit = daysFromNow(-submittedDaysAgo);
    const { quote, paymentFields } = quotePayment({
      packageId,
      pricePerDaySatang: RATE,
      expiryAtSubmit,
      now: submitNow,
    });
    const paymentId = await insert(db, schema.payments, {
      shopId,
      subscriptionId: subId,
      ...paymentFields,
      slipUrl: SLIP,
      status,
      submittedBy: ownerId,
      createdAt: daysFromNow(-submittedDaysAgo),
      ...extra,
    });
    return { paymentId, quote, expiryAtSubmit };
  }

  if (opts.billing === "active") {
    // One approved d180 top-up last month → matching ledger row (bonus 20 days).
    const { paymentId, quote, expiryAtSubmit } = await addPayment(
      "d180",
      "approved",
      29,
      { verifiedBy: adminId, verifiedAt: daysFromNow(-28) },
    );
    const { ledgerRow } = approveTopup({
      shopId,
      paymentId,
      reviewerId: adminId,
      daysToAdd: quote.baseDays,
      bonusDays: quote.bonusDays,
      amountSatang: quote.amountSatang,
      expiryBeforeAt: expiryAtSubmit,
      now: new Date(Date.now() - 28 * DAY),
    });
    await insert(db, schema.topupTransactions, {
      ...ledgerRow,
      createdAt: daysFromNow(-28),
    });
  } else if (opts.billing === "grace") {
    // A pending payment awaiting review (no ledger until approved).
    await addPayment("d30", "pending", 0);
  } else if (opts.billing === "suspended") {
    // A rejected attempt + a fresh pending one in the admin queue.
    await addPayment("d30", "rejected", 3, {
      verifiedBy: adminId,
      verifiedAt: daysFromNow(-2),
      rejectReason: "ยอดเงินในสลิปไม่ตรงกับที่แจ้ง",
    });
    await addPayment("d30", "pending", 0);
  }
  // admin-suspended: no payment history needed.
}
