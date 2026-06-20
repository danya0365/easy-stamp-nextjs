import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb, seedShop } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";
import { AddStampsUseCase } from "./AddStampsUseCase";
import { RedeemRewardUseCase } from "./RedeemRewardUseCase";
import { AnnotateCustomerEligibilityUseCase } from "./AnnotateCustomerEligibilityUseCase";
import { BuildRedemptionItemsUseCase } from "./BuildRedemptionItemsUseCase";

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

function eligibility() {
  return new AnnotateCustomerEligibilityUseCase(
    container.stampTypeRepository,
    container.stampCardRepository,
    container.stampBalanceRepository,
  );
}

function redemptionItems() {
  return new BuildRedemptionItemsUseCase(
    container.customerRepository,
    container.branchRepository,
  );
}

test("eligibility: a completed card counts as eligible, an under-threshold one does not", async () => {
  const { shop, ownerId, defaultType } = await seedShop("proj-elig");

  await addStamps().execute({
    shopId: shop.id,
    phone: "0810000011",
    stampTypeId: defaultType.id,
    quantity: defaultType.threshold,
    performedBy: ownerId,
  });
  await addStamps().execute({
    shopId: shop.id,
    phone: "0810000012",
    stampTypeId: defaultType.id,
    quantity: 3,
    performedBy: ownerId,
  });

  const customers = await container.customerRepository.listByShop(shop.id);
  const rows = await eligibility().execute(shop.id, customers);

  const completed = rows.find((r) => r.customer.phone === "0810000011");
  const partial = rows.find((r) => r.customer.phone === "0810000012");
  assert.equal(completed?.eligible, 1, "completed card eligible for 1 type");
  assert.equal(partial?.eligible, 0, "under-threshold card not eligible");
});

test("redemption labels: shop view attaches customer label, customer view does not", async () => {
  const { shop, ownerId, defaultType } = await seedShop("proj-redemp");
  const phone = "0810000013";

  await addStamps().execute({
    shopId: shop.id,
    phone,
    stampTypeId: defaultType.id,
    quantity: defaultType.threshold,
    performedBy: ownerId,
  });
  await new RedeemRewardUseCase(
    container.shopRepository,
    container.customerRepository,
    container.stampCardRepository,
    container.stampTypeRepository,
    container.stampBalanceRepository,
    container.stampTransactionRepository,
    container.rewardRedemptionRepository,
  ).execute({ shopId: shop.id, phone, stampTypeId: defaultType.id, performedBy: ownerId });

  const page = await container.rewardRedemptionRepository.pageByShop(shop.id);
  assert.equal(page.items.length, 1, "one redemption recorded");

  const shopItems = await redemptionItems().forShop(shop.id, page.items);
  assert.ok(shopItems[0].customerLabel, "shop view has a customer label");
  assert.notEqual(shopItems[0].customerLabel, "ลูกค้า", "label resolved, not fallback");
  assert.equal(shopItems[0].branchLabel, null, "no branch → null branch label");

  const custItems = await redemptionItems().forCustomer(shop.id, page.items);
  assert.equal(custItems[0].customerLabel, undefined, "customer view omits customer label");
});
