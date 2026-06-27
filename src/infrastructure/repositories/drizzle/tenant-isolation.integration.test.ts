import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb, seedShop } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";
import { AddStampsUseCase } from "@/src/application/use-cases/stamp/AddStampsUseCase";
import { RedeemRewardUseCase } from "@/src/application/use-cases/stamp/RedeemRewardUseCase";

/**
 * Negative multi-tenant tests: one shop must never see or touch another shop's
 * data. This guards the semantic rule "every query is scoped by shopId" that the
 * import-graph linter can't see — if a repo drops its shopId filter, a test here
 * goes red.
 */

before(migrateTestDb);

function addStamps() {
  return new AddStampsUseCase(
    container.shopRepository,
    container.customerRepository,
    container.stampCardRepository,
    container.stampTypeRepository,
    container.stampBalanceRepository,
    container.stampTransactionRepository,
  );
}

function redeem() {
  return new RedeemRewardUseCase(
    container.shopRepository,
    container.customerRepository,
    container.stampCardRepository,
    container.stampTypeRepository,
    container.stampBalanceRepository,
    container.stampTransactionRepository,
    container.rewardRedemptionRepository,
  );
}

const PHONE = "0810000001";

/**
 * Seed shop A with a maxed-out card for PHONE, plus an empty shop B. `tag` makes
 * the slugs/emails unique per test (the in-memory DB is shared across the file).
 */
async function seedTwoShops(tag: string) {
  const a = await seedShop(`iso-a-${tag}`);
  const b = await seedShop(`iso-b-${tag}`);
  await addStamps().execute({
    shopId: a.shop.id,
    phone: PHONE,
    stampTypeId: a.defaultType.id,
    quantity: a.defaultType.threshold,
    performedBy: a.ownerId,
  });
  const customerA = (await container.customerRepository.findByPhone(
    a.shop.id,
    PHONE,
  ))!;
  return { a, b, customerA };
}

test("customer lookups are scoped: B cannot see A's customer", async () => {
  const { a, b, customerA } = await seedTwoShops("cust");

  // Positive control: A sees its own customer.
  assert.ok(await container.customerRepository.findByPhone(a.shop.id, PHONE));

  // B sees nothing for the same phone / public code / list.
  assert.equal(
    await container.customerRepository.findByPhone(b.shop.id, PHONE),
    null,
  );
  assert.equal(
    await container.customerRepository.findByPublicCode(
      b.shop.id,
      customerA.publicCode,
    ),
    null,
  );
  const bCustomers = await container.customerRepository.listByShop(b.shop.id);
  assert.equal(bCustomers.length, 0);
});

test("card + ledger are scoped: A's customerId is invisible under shop B", async () => {
  const { a, b, customerA } = await seedTwoShops("card");

  // Positive control: card + ledger exist under A.
  assert.ok(
    await container.stampCardRepository.findByCustomer(a.shop.id, customerA.id),
  );
  assert.ok(
    (
      await container.stampTransactionRepository.listByCustomer(
        a.shop.id,
        customerA.id,
      )
    ).length > 0,
  );

  // Forging A's customerId under shop B yields nothing.
  assert.equal(
    await container.stampCardRepository.findByCustomer(b.shop.id, customerA.id),
    null,
  );
  assert.deepEqual(
    await container.stampTransactionRepository.listByCustomer(
      b.shop.id,
      customerA.id,
    ),
    [],
  );
});

test("same phone in another shop is a separate customer; A's balance untouched", async () => {
  const { a, b, customerA } = await seedTwoShops("phone");

  // Stamp the same phone in shop B → a brand-new, independent customer.
  await addStamps().execute({
    shopId: b.shop.id,
    phone: PHONE,
    stampTypeId: b.defaultType.id,
    quantity: 1,
    performedBy: b.ownerId,
  });
  const customerB = (await container.customerRepository.findByPhone(
    b.shop.id,
    PHONE,
  ))!;
  assert.notEqual(customerB.id, customerA.id);

  // A's maxed-out balance is unaffected by activity in B.
  const cardA = (await container.stampCardRepository.findByCustomer(
    a.shop.id,
    customerA.id,
  ))!;
  const balA = await container.stampBalanceRepository.findByCardAndType(
    cardA.id,
    a.defaultType.id,
  );
  assert.equal(balA?.currentStamps, a.defaultType.threshold);

  // B's customer only has 1 stamp → redeeming in B is rejected (no cross-shop pull).
  await assert.rejects(
    redeem().execute({
      shopId: b.shop.id,
      phone: PHONE,
      stampTypeId: b.defaultType.id,
      performedBy: b.ownerId,
    }),
    /ยังไม่ครบ/,
  );
});

test("reviews are scoped: a review in A is absent from B", async () => {
  const { a, b, customerA } = await seedTwoShops("review");
  await container.shopReviewRepository.upsert({
    shopId: a.shop.id,
    customerId: customerA.id,
    rating: 5,
    comment: null,
  });

  const inA = await container.shopReviewRepository.pageByShop(a.shop.id);
  assert.equal(inA.items.length, 1);
  const inB = await container.shopReviewRepository.pageByShop(b.shop.id);
  assert.equal(inB.items.length, 0);
});
