import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";
import { CreateShopUseCase } from "@/src/application/use-cases/shop/CreateShopUseCase";
import { AddStampsUseCase } from "./AddStampsUseCase";
import { RedeemRewardUseCase } from "./RedeemRewardUseCase";

before(async () => {
  await migrateTestDb();
});

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

async function makeShop(slug: string) {
  const { shop } = await new CreateShopUseCase(
    container.shopRepository,
    container.userRepository,
    container.subscriptionRepository,
    container.passwordHasher,
    container.shopCategoryRepository,
    container.stampTypeRepository,
    container.branchRepository,
  ).execute({
    name: `Shop ${slug}`,
    slug,
    ownerEmail: `${slug}@test.local`,
    ownerPassword: "password123",
    categoryId: null,
  });
  const types = await container.stampTypeRepository.listByShop(shop.id, {
    activeOnly: true,
  });
  const owner = (await container.userRepository.listByShop(shop.id)).find(
    (u) => u.role === "shop_owner",
  )!;
  return { shop, type: types[0], performedBy: owner.id };
}

test("CreateShop bootstraps shop + owner + trial subscription + default stamp type", async () => {
  const { shop, type } = await makeShop("flow-a");
  const owner = (await container.userRepository.listByShop(shop.id)).find(
    (u) => u.role === "shop_owner",
  );
  assert.ok(owner, "owner account created");
  const sub = await container.subscriptionRepository.findByShop(shop.id);
  assert.equal(sub?.status, "trialing");
  assert.ok(type && type.threshold === 10, "default stamp type with threshold 10");
});

test("add stamps to threshold then redeem resets balance + writes ledgers", async () => {
  const { shop, type, performedBy } = await makeShop("flow-b");
  const phone = "0812345678";

  await addStamps().execute({
    shopId: shop.id,
    phone,
    stampTypeId: type.id,
    quantity: type.threshold,
    performedBy,
  });

  const customer = await container.customerRepository.findByPhone(
    shop.id,
    "0812345678",
  );
  assert.ok(customer, "customer auto-created on first stamp");
  const card = await container.stampCardRepository.findByCustomer(
    shop.id,
    customer!.id,
  );
  const balBefore = await container.stampBalanceRepository.findByCardAndType(
    card!.id,
    type.id,
  );
  assert.equal(balBefore?.currentStamps, type.threshold);

  const view = await redeem().execute({
    shopId: shop.id,
    phone,
    stampTypeId: type.id,
    performedBy,
  });

  const balAfter = await container.stampBalanceRepository.findByCardAndType(
    card!.id,
    type.id,
  );
  assert.equal(balAfter?.currentStamps, 0, "balance reset after redeem");
  assert.equal(balAfter?.rewardsEarned, 1, "one reward earned");

  // Ledgers: one earn (+threshold) and one redeem_adjust (-threshold).
  const txns = await container.stampTransactionRepository.listByCustomer(
    shop.id,
    customer!.id,
  );
  assert.equal(txns.filter((t) => t.type === "earn").length, 1);
  assert.equal(txns.filter((t) => t.type === "redeem_adjust").length, 1);

  // The returned view reflects the type as no-longer-eligible.
  const progress = view.types.find((t) => t.type.id === type.id);
  assert.equal(progress?.eligibleToRedeem, false);
});

test("redeem before threshold throws", async () => {
  const { shop, type, performedBy } = await makeShop("flow-c");
  const phone = "0899999999";
  await addStamps().execute({
    shopId: shop.id,
    phone,
    stampTypeId: type.id,
    quantity: 3,
    performedBy,
  });
  await assert.rejects(
    redeem().execute({
      shopId: shop.id,
      phone,
      stampTypeId: type.id,
      performedBy,
    }),
    /ยังไม่ครบ/,
  );
});

test("add stamps rejects invalid quantity and bad phone", async () => {
  const { shop, type } = await makeShop("flow-d");
  await assert.rejects(
    addStamps().execute({
      shopId: shop.id,
      phone: "0812345678",
      stampTypeId: type.id,
      quantity: 0,
      performedBy: "t",
    }),
    /จำนวนแสตมป์/,
  );
  await assert.rejects(
    addStamps().execute({
      shopId: shop.id,
      phone: "123",
      stampTypeId: type.id,
      quantity: 1,
      performedBy: "t",
    }),
    /เบอร์โทร/,
  );
});
