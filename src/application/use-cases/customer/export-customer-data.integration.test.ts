import { before, test } from "node:test";
import assert from "node:assert/strict";

import { migrateTestDb, seedShop } from "@/src/test/helpers";
import { container } from "@/src/infrastructure/di/container";
import { AddStampsUseCase } from "@/src/application/use-cases/stamp/AddStampsUseCase";
import { ExportCustomerDataUseCase } from "./ExportCustomerDataUseCase";

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

function exporter() {
  return new ExportCustomerDataUseCase(
    container.shopRepository,
    container.customerRepository,
    container.stampCardRepository,
    container.stampBalanceRepository,
    container.stampTypeRepository,
    container.stampTransactionRepository,
    container.rewardRedemptionRepository,
    container.shopReviewRepository,
  );
}

test("exports a customer's data scoped to the shop", async () => {
  const { shop, defaultType, ownerId } = await seedShop("pdpa-a");
  const phone = "0820000002";
  await addStamps().execute({
    shopId: shop.id,
    phone,
    stampTypeId: defaultType.id,
    quantity: 3,
    performedBy: ownerId,
  });
  const customer = (await container.customerRepository.findByPhone(shop.id, phone))!;

  const data = await exporter().execute(shop.id, customer.id);
  assert.equal(data.shop.id, shop.id);
  assert.equal(data.customer.phone, phone);
  assert.equal(data.customer.id, customer.id);
  assert.equal(data.stampBalances.length, 1);
  assert.equal(data.stampBalances[0].currentStamps, 3);
  assert.equal(data.transactions.length, 1); // one earn
  assert.equal(data.review, null);
});

test("cannot export a customer that belongs to another shop", async () => {
  const a = await seedShop("pdpa-x");
  const b = await seedShop("pdpa-y");
  const phone = "0820000003";
  await addStamps().execute({
    shopId: a.shop.id,
    phone,
    stampTypeId: a.defaultType.id,
    quantity: 1,
    performedBy: a.ownerId,
  });
  const customerA = (await container.customerRepository.findByPhone(a.shop.id, phone))!;

  // Shop B exporting A's customer id → not found (scoped by shopId).
  await assert.rejects(
    exporter().execute(b.shop.id, customerA.id),
    /ไม่พบลูกค้า/,
  );
});
